import logging
import json

from google.appengine.ext import ndb
from py.common.db_models import UserData
from datetime import datetime

from py.common.db_models import FeedData
from py.common.db_models import FeedDataSettings
from py.common.db_models import ReadData


def GetAppUserByEmail(email):
    ud = UserData.get_by_id(email)
    return ud

def CreateUsername(email):
    i = email.find("@")
    ud = UserData.get_by_id(email[:i])

    if ud is None:
        logging.debug('user name does not exists: %s', email[:i])
        return email[:i]

    while (ud != None):
        check_name = email[:i] + str(random.randrange(1, 9999))
        ud = UserData.get_by_id(check_name)

    return check_name

def CreateFirstTimeUser(user):
    username = self.CreateUsername(user.email())

    blogs = [{"url":"http://feeds.feedburner.com/TechCrunch","title":"TechCrunch"}, {"url":"http://feeds.feedburner.com/ommalik","title":"GigaOM"}, {"url":"http://feeds.feedburner.com/readwriteweb","title":"ReadWrite"},{"url":"http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider","title":"SAI"},{"url":"http://feeds.arstechnica.com/arstechnica/index","title":"Ars Technica"},{"url":"http://feeds.paidcontent.org/pcorg","title":"paidContent"},{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"},{"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]
    jsonBlogList = '{"username":"' + username + '", "bloglist":{"root":[{"url":"http://feeds.feedburner.com/TechCrunch","title":"TechCrunch"}], "1":[{"url":"http://feeds.feedburner.com/ommalik","title":"GigaOM"},{"url":"http://feeds.feedburner.com/readwriteweb","title":"ReadWrite"},{"url":"http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider","title":"SAI"},{"url":"http://feeds.arstechnica.com/arstechnica/index","title":"Ars Technica"},{"url":"http://feeds.paidcontent.org/pcorg","title":"paidContent"}],"2":[{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"}, {"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]}}'
    ud = UserData(app_username = username, id = user.email(), private_data = jsonBlogList, isActive = True)

    ud.put_async(use_cache=False, use_memcache=False) ##!

    logging.debug('create first time user: %s', username)

    for feed in blogs:
        readDataAttr = 'readData__' + str(feed['url']).translate(None, '.')
        rd = ReadData(app_username = username, feedUrl = feed['url'], readData = '', readCount = 0, id = readDataAttr)
        rd.put_async()

    return username

def GetCurrentDateTime():
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M")

def GetFeedDataSettings(feed):
    fds = FeedDataSettings.get_by_id(feed)
    
    if fds is None:
        logging.debug('Create FeedDataSettings for: %s', feed)
        fds = FeedDataSettings(url=feed, id=feed, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        fds.put(use_cache=False, use_memcache=False)

        user = users.get_current_user()
        ud = GetAppUserByEmail(user.email())
        if (ud is not None):
            readDataAttr = 'readData__' + str(feed).translate(None, '.')
            app_username = ud.app_username
            ReadData(app_username = app_username, feedUrl = feed, readData = '', readCount = 0, id = readDataAttr)

    return fds

def AddSomeData(d, feed, items, feedDataSettings, createNew):
    ## http://devblog.miumeet.com/2012/06/storing-json-efficiently-in-python-on.html
    ## RequestTooLargeError  http://stackoverflow.com/questions/5022725/how-do-i-measure-the-memory-usage-of-an-object-in-python

    logging.debug('add some data: %s', feed)

    newItemsCount = len(items)

    if feedDataSettings.private_data <> '':
        oldData = json.loads(feedDataSettings.private_data)
        items = items + oldData

    feedDataSettings.private_data = json.dumps(items)

    ## remember what have been added, and dont add same data
    httpId = items[0]['link']
    if httpId.startswith('https'):
        httpId = httpId.replace('https', 'http', 1)

    feedDataSettings.latest_item_id = items[0]['id']
    feedDataSettings.latest_http_link = httpId

    #rememeber modifed and etag
    if hasattr(d, 'modified'):
        feedDataSettings.new_modified = str(d.modified)
    if hasattr(d, 'etag'):
        feedDataSettings.new_etag = str(d.etag)

    if createNew:
        feedDataSettings.feedDataCount = feedDataSettings.feedDataCount + 1
        newKeyName = str(hash(feed) * hash(feed)) + '_' + str(feedDataSettings.feedDataCount)
        newFeedData = FeedData(url = feed, private_data = feedDataSettings.private_data, id = newKeyName)
        newFeedData.put()

        feedDataSettings.latest_item = newKeyName
        feedDataSettings.private_data = ''

    feedDataSettings.article_count = feedDataSettings.article_count + newItemsCount

    logging.debug('[READCOUNT DEBUG] Increase article count of %s to %s, createNew: %s', feed, feedDataSettings.article_count, createNew)
    feedDataSettings.put()
