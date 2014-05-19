#!/usr/bin/env python
# -*- coding: utf-8 -*-

## TODO
## 0. test the fuck out read and star data cashing
## 3. cron user - keep track of feed usasge and decrease/increase cron times
## 4. date.js
## 5. star folder
## 6. move from hash to somelib.hash

#  https://github.com/julien-maurel/jQuery-Storage-API
#  redirects https://github.com/ether/etherpad-lite/issues/1603

import os, sys

from jinja2 import Environment, FileSystemLoader
jinja_environment = Environment(loader=FileSystemLoader(os.path.dirname(__file__)))

import webapp2
from google.appengine.ext import db
from google.appengine.api import memcache
from google.appengine.api import users
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers

import feedparser
import urllib
import json
import logging
import urlnorm
from datetime import datetime



class UserData(db.Expando):
    app_username = db.StringProperty(required=True)
    owner_email = db.UserProperty(required=True)
    isActive = db.BooleanProperty(default=False)
    private_data = db.TextProperty()
    ##'starData__' + feed_url
    ##'readData__' + feed_url
    ##'readCount__' + feed_url


class FeedDataSettings(db.Expando):
    url = db.StringProperty(required=True)
    new_etag = db.StringProperty()
    new_modified = db.StringProperty()
    article_count = db.IntegerProperty()
    latest_item = db.StringProperty()
    feedDataCount = db.IntegerProperty()
    private_data = db.TextProperty()
    latest_item_id = db.StringProperty()
    latest_http_link = db.StringProperty() ##latest item, normalized to http - i.e https://foo.bar becomes http://foo.bar
    refCount = db.IntegerProperty()

class FeedData(db.Expando):
    url = db.StringProperty(required=True)
    private_data = db.TextProperty()
    prev_item = db.StringProperty()


class BasicHandler(webapp2.RequestHandler):
    def GetAppUserByEmail(self, email):
        ud = UserData.all()
        ud.filter("owner_email =", email)
        results = ud.fetch(1)
        for p in results:
            return p

        return None

    def GetAppUserByUsername(self, username):
        ud = UserData.all()
        ud.filter("app_username =", username)
        results = ud.fetch(1)
        for p in results:
            return p

        return None

    def CreateUsername(self, email):
        i = email.find("@")
        if (i == -1): ## not an email
            return email

        ud = UserData.get_by_key_name(email[:i])
        if ud == None:## username does not exists
            return email[:i]

        import random
        while (ud != None):
            check_name = email[:i] + str(random.randrange(1, 999))
            ud = UserData.get_by_key_name(check_name)

        return check_name

    def GetNameFromEmail(self, email):
        i = email.find("@")
        if (i == -1): ## not an email
            return email

        return email[:i]

    def CreateFirstTimeUser(self, user):
        ##todo - validate username, so it does contains a..z, 0..9,
        ## FIRST VISIT -> create default lists
        username = self.CreateUsername(user.nickname())
        ##jsonBlogList = '{"username":"' + username + '", "bloglist": {"1": [{"url": "http://feeds.feedburner.com/TechCrunch", "title":"http://feeds.feedburner.com/TechCrunch"},{"url": "http://feeds.feedburner.com/ommalik", "title":"http://feeds.feedburner.com/ommalik" },{"url": "http://feeds.feedburner.com/readwriteweb", "title":"http://feeds.feedburner.com/readwriteweb" },{"url": "http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider", "title":"http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider" },{"url": "http://feeds.arstechnica.com/arstechnica/index", "title":"http://feeds.arstechnica.com/arstechnica/index" },{"url": "http://feeds.paidcontent.org/pcorg", "title":"http://feeds.paidcontent.org/pcorg" } ],"2": [{"url": "http://www.engadget.com/rss.xml", "title":"http://feeds.feedburner.com/ommalik" },{"url": "http://feeds.gawker.com/gizmodo/full", "title":"http://feeds.feedburner.com/ommalik" },{"url": "http://feeds.feedburner.com/TheBoyGeniusReport", "title":"http://feeds.feedburner.com/ommalik" } ] }}'
        jsonBlogList = '{"username":"' + username + '", "bloglist":{"1":[{"url":"http://feeds.feedburner.com/TechCrunch","title":"TechCrunch"},{"url":"http://feeds.feedburner.com/ommalik","title":"GigaOM"},{"url":"http://feeds.feedburner.com/readwriteweb","title":"ReadWrite"},{"url":"http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider","title":"SAI"},{"url":"http://feeds.arstechnica.com/arstechnica/index","title":"Ars Technica"},{"url":"http://feeds.paidcontent.org/pcorg","title":"paidContent"}],"2":[{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"},{"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]}}'
        ud = UserData(app_username = username, key_name = username, owner_email = users.get_current_user(), private_data = jsonBlogList, isActive = False)
        ud.put()

        return username

    def GetFeedDataSettings(self, feed):
        cacheKey = 'feed_data_settings___' + feed
        fdh = None
        if MEMCACHE_ENABLED:
            fdh = memcache.get(cacheKey)

        if (fdh is None):
            fdh = FeedDataSettings.all().filter("url =", feed).get()
            
        if (fdh is None):
            logging.debug('Create FeedDataSettings for: %s', feed)
            fdh = FeedDataSettings(url=feed, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
            fdh.put()
        else:
            if MEMCACHE_ENABLED:
                memcache.set(cacheKey, fdh, 3600) ## 1h

        return fdh

    def isAdminUser(self):
        user = users.get_current_user()
        if not user: ## NOT LOGGED IN
            return False

        ud = self.GetAppUserByEmail(user)
        if ud == None:
            return False

        if ud.app_username != 'smonev':
            return False

        return true


class MainHandler(BasicHandler):
    def get(self):
        user = users.get_current_user()

        if not user: ## NOT LOGGED IN
            html_template = 'html/hello.htm'
            template_values = {
                'login_url': users.create_login_url(self.request.uri)
            }
        else: ## LOGGED IN
            ud = self.GetAppUserByEmail(user)
            if ud == None:
                self.CreateFirstTimeUser(user)
                self.redirect('/')
                return

            if ud.isActive == False:
                #ud.isActive = True
                #ud.put()

                html_template = 'html/hello.htm'
                template_values = {
                    'login_url': users.create_login_url(self.request.uri),
                    'waiting': 'Waiting for activation'
                }
            else:
                upload_url = blobstore.create_upload_url('/uploadOPML')
                html_template = 'html/app.htm'
                template_values = {
                    'logout':users.create_logout_url(self.request.uri),
                    'upload_url': upload_url
                }

        template = jinja_environment.get_template(html_template)
        self.response.headers['Content-Type'] = 'text/html'
        self.response.out.write(template.render(template_values))


class CronFeedsHandler(BasicHandler):

    def getUserBlogList(self):
        ud = UserData.all().fetch(1)[0]
        return ud.private_data
        

    def get6thFeedEveryTenMinutes(self, allFeeds):
        i = -1
        d = datetime.now()
        minute = d.minute / 10 ## process every 6th blog every 10 minutes = 1h for all
        blogToProcess = []

        # bloglist = self.getUserBlogList()
        # j = json.loads(bloglist)
        # for folder in j['bloglist']:
        #     for blog in j['bloglist'][folder]:
        #         i = i + 1
        #         if (i == minute) or (allFeeds):
        #             i = -1
        #             blogToProcess.append(blog['url'])

        ## check globalFeeds and reuse them in the instance running

        cacheKey = 'feed_data_settings___all'
        feeds = None 
        if MEMCACHE_ENABLED:
            feeds = memcache.get(cacheKey)

        if (feeds is None):
            feeds = FeedDataSettings.all()
            if MEMCACHE_ENABLED:
                memcache.set(cacheKey, feeds, 1800) ## 1h

        for f in feeds:
            i = i + 1
            if (i == minute) or (allFeeds):
                i = -1
                blogToProcess.append(f.url)

        self.response.out.write(blogToProcess)
        return blogToProcess

    def get(self):
        from google.appengine.api import urlfetch

        allFeeds = self.request.get('allFeeds')
        urls = self.get6thFeedEveryTenMinutes(allFeeds == '1')
        rpcs = []
        resultUrls = []
        
        for url in urls:
            url = urllib.quote_plus(url)
            url = 'http://' + self.request.host + '/cronfeed/' + url
            rpc = urlfetch.create_rpc()
            urlfetch.make_fetch_call(rpc, url)
            rpcs.append(rpc)

            resultUrls.append(url)

        for rpc in rpcs:
            rpc.wait()

        # resultUrls = []
        # urls = self.getFeedsToParse()
        # for url in urls:
        #     url = 'http://' + self.request.host + '/cronfeed/' + url
        #     resultUrls.append(url)
        #     urlfetch.fetch(url=url)

        self.response.out.write('ok')
        self.response.out.write(', '.join(resultUrls))




class CronFeedHandler(BasicHandler):

    def GetCurrentDateTime(self):
        now = datetime.now()
        return now.strftime("%Y-%m-%d %H:%M")

    def AddSomeData(self, d, feed, items, feedDataSettings, createNew):
            ## http://devblog.miumeet.com/2012/06/storing-json-efficiently-in-python-on.html
            ## RequestTooLargeError  http://stackoverflow.com/questions/5022725/how-do-i-measure-the-memory-usage-of-an-object-in-python

            if feedDataSettings.private_data <> '':
                oldData = json.loads(feedDataSettings.private_data)
                items = items + oldData

            feedDataSettings.private_data = json.dumps(items)

            ## rememer what have been added, and dont add same data
            httpId = items[0]['link']
            if httpId.startswith('https'):
                httpId = httpId.replace('https', 'http', 1)
            ##httpId = str(hash(httpId))

            feedDataSettings.latest_item_id = items[0]['id']
            feedDataSettings.latest_http_link = httpId

            self.response.out.write('<br>')
            self.response.out.write('set feedDataSettings.latest_item_id after: ' + feedDataSettings.latest_item_id)
            self.response.out.write('<br>')
            self.response.out.write('set feedDataSettings.latest_http_link after: ' + feedDataSettings.latest_http_link)
            self.response.out.write('<br>')

            self.response.out.write(items)



            #rememeber modifed and etag
            if hasattr(d, 'modified'):
                feedDataSettings.new_modified = str(d.modified)
            if hasattr(d, 'etag'):
                feedDataSettings.new_etag = str(d.etag)

            if createNew:
                feedDataSettings.feedDataCount = feedDataSettings.feedDataCount + 1
                newKeyName = str(hash(feed) * hash(feed)) + '_' + str(feedDataSettings.feedDataCount)
                newFeedData = FeedData(url = feed, private_data = feedDataSettings.private_data, prev_item = feedDataSettings.latest_item, key_name = newKeyName)
                newFeedData.put()

                feedDataSettings.latest_item = newKeyName
                feedDataSettings.private_data = ''

            logging.debug('[READCOUNT DEBUG] Increase read count of %s to %s, createNew: %s', feed, feedDataSettings.article_count, createNew)

            feedDataSettings.put()

    def GetAndParse(self, feed, debug):
        import urllib
        feed = urllib.unquote_plus(feed) ## because of encodeURIComponent
        feedDataSettings = self.GetFeedDataSettings(feed)

        etag = getattr(feedDataSettings, 'new_etag', None)
        modified = getattr(feedDataSettings, 'new_modified', None)

        self.response.out.write('<br>')
        self.response.out.write(etag)
        self.response.out.write('<br>')
        self.response.out.write(modified)

        d = feedparser.parse(feed, etag=etag, modified=modified)
        items = []
        itemSize = sys.getsizeof(feedDataSettings.private_data)

        self.response.out.write('<br>')
        self.response.out.write('<br>')
        
        entriesCount = 0

        for e in d['entries']:
            di = {}

            di['link'] = getattr(e, 'link', 'THIS_WILL_HUNT_ME')
            di['id'] = str(hash(getattr(e, 'id', di['link']))) ## use hashlib.hexdigest?
           
            httpId = di['link']
            if httpId.startswith('https'):
                httpId = httpId.replace('https', 'http', 1)

            self.response.out.write('<br>')
            self.response.out.write('compare feedDataSettings.latest_item_id == di id')
            self.response.out.write('<br>')
            self.response.out.write(feedDataSettings.latest_item_id)
            self.response.out.write('<br>')
            self.response.out.write(di['id'])
            self.response.out.write('<br>')

            ## compare by id and by http link (some feeds keep generating radnom(?!?) http or https prefix thus the normalization)
            if feedDataSettings.latest_item_id == di['id']:
                if len(items) > 0:
                    self.AddSomeData(d, feed, items, feedDataSettings, False)
                    items = []

                break

            self.response.out.write('<br>')
            self.response.out.write('compare feedDataSettings.latest_http_link == httpId')
            self.response.out.write('<br>')
            self.response.out.write(feedDataSettings.latest_http_link)
            self.response.out.write('<br>')
            self.response.out.write(httpId)
            self.response.out.write('<br>')

            if feedDataSettings.latest_http_link == httpId:
                if len(items) > 0:
                    self.AddSomeData(d, feed, items, feedDataSettings, False)
                    items = []

                break

            di['title'] = getattr(e, 'title', '')
            di['author'] = getattr(e, 'author', '')

            try:  di['published'] = e.published
            except: di['published'] = self.GetCurrentDateTime()

            try:
                if hasattr(e, 'content'):
                    if len(e.content) > 0:
                        headline_content = ''
                        lEntries = len(e.content)
                        for eCount in range(0, lEntries):
                            headline_content = headline_content + e.content[eCount].value
                        di['content'] = headline_content
                else:
                    di['content'] = e.description
            except:
                di['content'] = ''

            ##di['content'] = di['content'][:600]

            if hasattr(d, 'feed'):
                if hasattr(d['feed'], 'title'):
                    di['feedTitle'] = d['feed']['title']

            feedDataSettings.article_count = feedDataSettings.article_count + 1

            itemSize = itemSize + sys.getsizeof(di)
            if itemSize < 80000: ## todo more preciese calcs here
                items.append(di)
            else:
                self.AddSomeData(d, feed, items, feedDataSettings, True)
                itemSize = 0
                items = []

            entriesCount = entriesCount + 1
            if entriesCount > 100:
                ## well, just stop
                break
                

        if len(items) > 0:
            self.AddSomeData(d, feed, items, feedDataSettings, False)

    def get(self, feed):
        if feed != '':
            self.response.out.write(feed)
            self.GetAndParse(feed, self.request.get('debug') == '1')
            self.response.out.write('ok')
        else:
            self.response.out.write('wtf feed')
            logging.debug('wtf feed')


class FeedHandler(BasicHandler):

    def getNewFeedViaCron(self, feed):
        try:
            feed = 'http://' + self.request.host + '/cronfeed/' + feed
            result = urllib.urlopen(feed).read()
        except urllib2.URLError, e:
            logging.debug('Error in getNewFeedViaCron: %s', feed)

        return 'done'

    def getFeedData(self, feedUrl, count):
        keyName = str(hash(feedUrl) * hash(feedUrl)) + '_' + str(count)

        feedDataSettings = self.GetFeedDataSettings(feedUrl)
        article_count = feedDataSettings.article_count
        if count == '-1':
            feedData = feedDataSettings.private_data
            priorData = feedDataSettings.feedDataCount
        else: 
            feedData = None
            if MEMCACHE_ENABLED:
                feedData = memcache.get(keyName)

            if feedData is None:
                fd = FeedData.get_by_key_name(keyName)
                feedData = fd.private_data

            priorData = int(count) - 1
            
        if MEMCACHE_ENABLED:
            memcache.set(keyName, feedData, 3600) ## 60 minutes

        return feedData, keyName, priorData, article_count

    def getReadData(self, feed_url):
        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if ud != None:
                readDataAttr = 'readData__' + feed_url
                readCountAttr = 'readCount__' + feed_url

                readData = getattr(ud, readDataAttr, '')
                readCount = getattr(ud, readCountAttr, '0')

                return readData, readCount

        return '', 0

    def getStarData(self, feed_url):
        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if ud != None:
                starDataAttr = 'starData__' + feed_url
                starData = getattr(ud, starDataAttr, '')
                return starData

        return ''
      
    def get(self, feed_url):
        import random


        feed_url = urllib.unquote_plus(feed_url)
        
        newFeed = self.request.get('newFeed')
        if int(newFeed) == 1:
            self.getNewFeedViaCron(feed_url)

        count = self.request.get('count')
        if (count is None):
            count = -1

        feed_data, key_name, nextCount, article_count = self.getFeedData(feed_url, count)

        ## read and star data should be one separate ajax call, so feed data can be cached at brwser level
        read_data, read_count = self.getReadData(feed_url)
        star_data = self.getStarData(feed_url)

        combined = {'feed': feed_data, 'read': read_data, 'feedIsRead': article_count <= read_count, 'read_count': read_count, 'article_count': article_count, 'star': star_data, 'key_name': key_name, 'nextcount': nextCount, 'ver': random.randrange(1,100000)}

        ## NB when logged in as admin, GAE changes these to cache-control: no-cache, must-revalidate. 
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "public, max-age=1800" ##30 minutes
        ##self.response.headers['Cache-Control'] = "private"
        self.response.out.write(str(json.dumps(combined)))

class SaveSettingsHandler(BasicHandler):

    def addNewFeed(self, feedUrl):
        logging.debug('adding feed: %s', feedUrl)
        fdh = None
        fdh = FeedDataSettings.all().filter("url =", feedUrl).get()
            
        if (fdh is None):
            fdh = FeedDataSettings(url=feedUrl, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        else:
            fdh.refCount = fdh.refCount + 1;

        fdh.put()
    
    def deleteFeed(self, feedUrl):
        logging.debug('deleting feed: %s', feedUrl)
        fdh = None
        fdh = FeedDataSettings.all().filter("url =", feedUrl).get()
            
        if (fdh is not None):
            fdh.refCount = fdh.refCount - 1
            logging.debug('deleting feed %s, refCount: %s', feedUrl, fdh.refCount)
            if fdh.refCount > 0:
                fdh.put()
            else:
                db.delete(fdh)

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if ud != None:
                s = self.request.get('data')

                newFeed = self.request.get('newFeed')
                if newFeed:
                    self.addNewFeed(newFeed)

                ## todo delete folder
                deleteFeed = self.request.get('deleteFeed')
                if deleteFeed:
                    self.deleteFeed(deleteFeed)

                s = '{"username":"' + ud.app_username + '", ' + s[1:]
                ud.private_data = s
                ud.put()

                self.response.out.write("ok")

class MarkArticlesAsRead(BasicHandler):
    def findArticlesToMarkAsRead(self, feedData, feedDataSettings):
        try:
            articles = json.loads(feedData)
            articleIds = [article['id'] for article in articles]
        except:
            articleIds = []

        return articleIds

    def findAndMarkAllArticles(self, feedUrl, feedDataSettings):
        ## find the data
        count = 1
        articlesToMarkAsRead = []
        articlesToMarkAsRead = articlesToMarkAsRead + self.findArticlesToMarkAsRead(feedDataSettings.private_data, feedDataSettings)

        while (count <= feedDataSettings.feedDataCount):
            keyName = str(hash(feedUrl) * hash(feedUrl)) + '_' + str(count)

            feedData = None
            if MEMCACHE_ENABLED:
                feedData = memcache.get(keyName)

            if feedData is None:
                fd = FeedData.get_by_key_name(keyName)
                feedData = fd.private_data

            if feedData is None:
                break

            articlesToMarkAsRead = articlesToMarkAsRead + self.findArticlesToMarkAsRead(feedData, feedDataSettings)

            count = count + 1

        return articlesToMarkAsRead

    def post(self):
        from google.appengine.api import users

        readOrUnread = 1 if self.request.get('read') == '1' else -1
        allRead = True if self.request.get('allRead') == '1' else False

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if ud != None:
                data = self.request.get('data')
                data = json.loads(data)

                for feedUrl in data:
                    readDataAttr = 'readData__' + feedUrl
                    readCountAttr = 'readCount__' + feedUrl
                    articleCount = 0

                    if allRead == True:
                        feedUrl = urllib.unquote_plus(feedUrl)
                        feedDataSettings = self.GetFeedDataSettings(feedUrl)
                        newReadCount = feedDataSettings.article_count
                        articleCount = feedDataSettings.article_count

                        articlesToMarkAsRead = self.findAndMarkAllArticles(feedUrl, feedDataSettings)
                    else:
                        articlesToMarkAsRead = data[feedUrl]

                    newReadCount = int(getattr(ud, readCountAttr, 0))
                    for readArticle in articlesToMarkAsRead:
                        if hasattr(ud, readDataAttr):
                            readUntilNow = getattr(ud, readDataAttr).split(',') ## this may be slow?
                            readArticle = str(readArticle)
                            if not readArticle in readUntilNow:
                                if readOrUnread == 1:
                                    readUntilNow.append(readArticle)
                                    readString = ','.join(str(read) for read in readUntilNow)
                                    ##setattr(ud, readDataAttr, db.Text(getattr(ud, readDataAttr) + ',' + str(readArticle)))
                                    setattr(ud, readDataAttr, db.Text(readString))
                                    newReadCount = newReadCount + readOrUnread
                            else:
                                if readOrUnread == -1:
                                    readUntilNow.remove(readArticle)
                                    readString = ','.join(str(read) for read in readUntilNow)
                                    setattr(ud, readDataAttr, db.Text(readString))
                                    newReadCount = newReadCount + readOrUnread
                        else:
                            if readOrUnread == 1:
                                setattr(ud, readDataAttr, db.Text(str(readArticle)))
                                newReadCount = newReadCount + 1

                    if allRead == True:
                        newReadCount = feedDataSettings.article_count

                    setattr(ud, readCountAttr, int(newReadCount))
                    logging.debug('[READCOUNT DEBUG] Set read count to: %s of %s (total article count: %s)', newReadCount, readCountAttr, articleCount)
                    ud.put()

                    if articleCount > 0:
                        ## if we went through settings
                        unreadCount = articleCount - newReadCount
                    else:
                        unreadCount = -1

                    self.response.out.write(str(json.dumps({'unreadCount': unreadCount, 'feedUrl': feedUrl})))


class StarArticle(BasicHandler):
    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if ud != None:
                data = self.request.get('data')
                data = json.loads(data)

                feedUrl = data['feed']
                starState = data['state']
                articleId = data['id']

                starDataAttr = 'starData__' + feedUrl

                if hasattr(ud, starDataAttr):
                    starUntilNow = getattr(ud, starDataAttr).split(',') ## slow?
                    if starState == 1:
                        if not articleId in starUntilNow:
                            setattr(ud, starDataAttr, db.Text(getattr(ud, starDataAttr) + ',' + str(articleId)))
                    else:
                        for article in reversed(starUntilNow):
                            if article == str(articleId):
                                starUntilNow.remove(article)

                        setattr(ud, starDataAttr, db.Text(",".join(starUntilNow)))
                else:
                    setattr(ud, starDataAttr, db.Text(str(articleId)))

                ud.put()

                self.response.out.write("ok")

class GetUserFeedsHandler(BasicHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user)
            if not (ud == None):
                self.response.out.write(ud.private_data)
                

class UploadOPMLHandler(blobstore_handlers.BlobstoreUploadHandler):
    ##jsonBlogList = '{"username":"' + username + '", "bloglist":{"1":[{"url":"3","title":"3"},{"url":"4","title":"4"}],"2":[{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"},{"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]}}'
    ##jsonBlogList = '{"username":"' + username + '", "bloglist":{ ## }'

    def addFeedToDataStore(self, feedUrl):
        fdh = None
        fdh = FeedDataSettings.all().filter("url =", feedUrl).get()
            
        if (fdh is None):
            fdh = FeedDataSettings(url=feedUrl, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        else:
            fdh.refCount = fdh.refCount + 1;

        logging.debug('adding feed to data store %s, refCount: %s', feedUrl, fdh.refCount)

        fdh.put()

    def addFeed(self, folder, feed, title):
        title = title.replace('"', '\\"')
        if self.current_folder <> folder:
            if self.current_folder <> '':
                if self.importedBlogList <> '':
                    self.importedBlogList = self.importedBlogList + ', "' + self.current_folder + '":[' + self.folder_feeds + ']'
                else:
                    self.importedBlogList = '"' + self.current_folder + '":[' + self.folder_feeds + ']'
                    
                self.folder_feeds = ''

            self.current_folder = folder

        if self.folder_feeds == '':
            self.folder_feeds = self.folder_feeds + '{"url":"' + feed + '","title":"' + title + '"}'
        else:
            self.folder_feeds = self.folder_feeds + ', ' + '{"url":"' + feed + '","title":"' + title + '"}'
            
    def processOutline(self, outline, currentFolder): 
        addedFeeds = 0; ##add first 50 feeds for processing, the rest -will be processed when requested
        for item in outline:
            if (not hasattr(item, 'xmlUrl') and (hasattr(item, 'text') or hasattr(item, 'title'))):
                folder = item
                title = getattr(item, 'text', None) or getattr(item, 'title', None)
                self.processOutline(folder, title)
            elif hasattr(item, 'xmlUrl'):

                if hasattr(item, 'title'):
                    title = getattr(item, 'title', None)
                else:
                    title = urlnorm.normalize(item.xmlUrl)

                addedFeeds = addedFeeds + 1
                self.addFeed(currentFolder, urlnorm.normalize(item.xmlUrl), title)
                if addedFeeds <= 50:
                    self.addFeedToDataStore(urlnorm.normalize(item.xmlUrl))

    def post(self):
        user = users.get_current_user()
        if not user:
            self.redirect('/')

        from google.appengine.ext import blobstore
        import opml

        ## get file
        upload_files = self.get_uploads('file')
        blob_info = upload_files[0]
        blob_reader = blobstore.BlobReader(blob_info.key())
        opmlFile = blob_reader.read()

        ## parse file
        self.current_folder = ''
        self.folder_feeds = ''
        self.importedBlogList = ''
        outline = opml.from_string(opmlFile)
        self.processOutline(outline, 'root')

        ## get username
        ud = UserData.all()
        ud.filter("owner_email =", user)
        results = ud.fetch(1)
        for p in results:
            ud = p

        ## save new data
        if ud != None:
            username = ud.app_username
            ud.private_data = '{"username":"' + username + '", "bloglist":{ ' + self.importedBlogList + ' }}'
            ud.put()

        self.redirect('/')


class UnauthorizedHandler(webapp2.RequestHandler):
    def get(self):
        self.error(403)
        self.response.out.write("mobile reader says:  nothing here. Coming soon:  Cooler nothinghere page!")

class NotFoundHandler(webapp2.RequestHandler):
    def get(self):
        self.error(404)

class RedirectHandler(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if not user:
            self.redirect('/')

        ## todo https://github.com/ether/etherpad-lite/issues/1603
        url = self.request.get('url')
        self.redirect(str(url), True)

# class DeleteAllFeedDataSettings(webapp2.RequestHandler):
#     def get(self):
#         ##self.response.out.write('commented')
#         return None

#         self.response.headers['Content-Type'] = 'text/plain'
#         q = db.GqlQuery("SELECT __key__ FROM FeedDataSettings")

#         results = q.fetch(1000)
#         db.delete(results)
        
#         self.response.out.write('done')

# class DeleteAllFeedData(webapp2.RequestHandler):
#     def get(self):
#         self.response.out.write('commented')
#         return None

#         self.response.headers['Content-Type'] = 'text/plain'
#         q = db.GqlQuery("SELECT __key__ FROM FeedData")

#         results = q.fetch(1000)
#         db.delete(results)
        
#         self.response.out.write('zzzz')
#         self.response.out.write('done')

        

# class DeleteAllUserData(webapp2.RequestHandler):
#     def get(self):
#         self.response.out.write('commented')
#         return None

#         self.response.headers['Content-Type'] = 'text/plain'
#         q = db.GqlQuery("SELECT __key__ FROM UserData")

#         results = q.fetch(1000)
#         db.delete(results)
        
#         self.response.out.write('done')

# class ShowUsersHandler(BasicHandler):
#     def get(self):
#         if not self.isAdminUser():
#             self.redirect('/')

#         html_template = 'html/showUsersHandler.htm'
#         template_values = {
            
#         }

#         template = jinja_environment.get_template(html_template)
#         self.response.headers['Content-Type'] = 'text/html'
#         self.response.out.write(template.render(template_values))

#         self.response.out.write('done')

# class getUsersHandler(BasicHandler):
#     def get(self):
#         if not self.isAdminUser():
#             self.redirect('/')

#         self.response.headers['Content-Type'] = 'application/json'
#         self.response.headers['Cache-Control'] = "private, max-age=0"
#         self.response.out.write(ud.private_data)



APP_ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')
MEMCACHE_ENABLED = False ## fix read and star data cashing, then enable this.

ROUTES = [
        # ('/deleteAllFeedDataSettings', DeleteAllFeedDataSettings),
        # ('/deleteAllUserData', DeleteAllUserData),
        # ('/deleteAllFeedData', DeleteAllFeedData),
        ('/403.html', UnauthorizedHandler),
        ('/404.html', NotFoundHandler),

        ('/GetUserFeeds',GetUserFeedsHandler),
        ('/SaveSettings',SaveSettingsHandler),
        ('/MarkArticlesAsRead',MarkArticlesAsRead),
        ('/StarArticle',StarArticle),

        ('/cronfeeds', CronFeedsHandler),
        ('/cronfeed/(.*)', CronFeedHandler),
        ('/feed/(.*)', FeedHandler),
        
        ('/uploadOPML', UploadOPMLHandler),
        ('/redirect', RedirectHandler),

        # ('/showUsers', ShowUsersHandler)

        ##('/opml', OpmlHandler),
        ('/', MainHandler)
]

app = webapp2.WSGIApplication(ROUTES, debug=DEBUG)
