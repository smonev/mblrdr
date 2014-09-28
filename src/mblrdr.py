#!/usr/bin/env python
# -*- coding: utf-8 -*-

## TODO
## -1. html escape when parsing and when use inputs sth
## 0. test the fuck out read and star data cashing
## 3. cron user - keep track of feed usasge and decrease/increase cron times
## 4. date.js
## 5. star folder
## 6. move from hash to somelib.hash
## 7. star cache
## 8. @ndb.transactional , async, dont wait urlopen requests
## 9. move 'root'


#  https://github.com/julien-maurel/jQuery-Storage-API
#  redirects https://github.com/ether/etherpad-lite/issues/1603

## cron runs every 2 minites and adds every 30 feed in a task to  get and parse new. 

import os, sys

from jinja2 import Environment, FileSystemLoader
jinja_environment = Environment(loader=FileSystemLoader(os.path.dirname(__file__)))

import webapp2

from google.appengine.ext import ndb

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
import random

from google.appengine.api import taskqueue


class UserData(ndb.Model):
    ##_default_indexed=False;  ##http://stackoverflow.com/questions/18557911/reducing-google-app-engine-built-in-index-size
    app_username = ndb.StringProperty(required=True, indexed=False)
    isActive = ndb.BooleanProperty(default=False)
    private_data = ndb.TextProperty()

class ReadData(ndb.Model):
    app_username = ndb.StringProperty(required=True)
    feedUrl = ndb.StringProperty(required=True, indexed=False)
    readData = ndb.TextProperty()
    readCount = ndb.IntegerProperty(indexed=False)

class StarData(ndb.Model):
    app_username = ndb.StringProperty(required=True)
    feedUrl = ndb.StringProperty(required=True, indexed=False)
    starData = ndb.TextProperty()

class FeedDataSettings(ndb.Model):
    url = ndb.StringProperty(required=True, indexed=True)
    new_etag = ndb.StringProperty(indexed=False)
    new_modified = ndb.StringProperty(indexed=False)
    article_count = ndb.IntegerProperty(indexed=False)
    latest_item = ndb.StringProperty(indexed=False)
    feedDataCount = ndb.IntegerProperty(indexed=False)
    private_data = ndb.TextProperty(indexed=False)
    latest_item_id = ndb.StringProperty(indexed=False)
    latest_http_link = ndb.StringProperty(indexed=False) ##latest item, normalized to http - i.e https://foo.bar becomes http://foo.bar
    refCount = ndb.IntegerProperty(indexed=False)
    # lastModified = ndb.DateTimeProperty(auto_now=True, indexed=False)
    # updateMeAfterThisTime = ndb.DateTimeProperty()
    # lastUpdateInterval = ndb.IntegerProperty(indexed=False)
    # updatesWithoutNewFeeds = ndb.IntegerProperty(default = 1, indexed=False)

class FeedData(ndb.Model):
    url = ndb.StringProperty(required=True, indexed=False)
    private_data = ndb.TextProperty(indexed=False)

class BasicHandler(webapp2.RequestHandler):
    
    def GetAppUserByEmail(self, email):
        ud = UserData.get_by_id(email)
        return ud

    def CreateUsername(self, email):
        i = email.find("@")
        ud = UserData.get_by_id(email[:i])

        if ud is None:
            logging.debug('user name does not exists: %s', email[:i])
            return email[:i]

        while (ud != None):
            check_name = email[:i] + str(random.randrange(1, 9999))
            ud = UserData.get_by_id(check_name)

        return check_name

    def CreateFirstTimeUser(self, user):
        username = self.CreateUsername(user.email())

        jsonBlogList = '{"username":"' + username + '", "bloglist":{"1":[{"url":"http://feeds.feedburner.com/TechCrunch","title":"TechCrunch"},{"url":"http://feeds.feedburner.com/ommalik","title":"GigaOM"},{"url":"http://feeds.feedburner.com/readwriteweb","title":"ReadWrite"},{"url":"http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider","title":"SAI"},{"url":"http://feeds.arstechnica.com/arstechnica/index","title":"Ars Technica"},{"url":"http://feeds.paidcontent.org/pcorg","title":"paidContent"}],"2":[{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"},{"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]}}'
        ud = UserData(app_username = username, id = user.email(), private_data = jsonBlogList, isActive = False)
        
        ud.put()

        logging.debug('create first time user: %s', username)

        return username

    def GetFeedDataSettings(self, feed):
        fds = FeedDataSettings.get_by_id(feed)
        
        if fds is None:
            logging.debug('Create FeedDataSettings for: %s', feed)
            fds = FeedDataSettings(url=feed, id=feed, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
            fds.put()

            user = users.get_current_user()
            ud = self.GetAppUserByEmail(user.email())
            if (ud is not None):
                readDataAttr = 'readData__' + str(feed).translate(None, '.')
                app_username = ud.app_username
                ReadData(app_username = app_username, feedUrl = feed, readData = '', readCount = 0, id = readDataAttr)

        return fds

    def GetAndParse(self, feed, debug):
        import urllib
        feed = urllib.unquote_plus(feed) ## because of encodeURIComponent
        feedDataSettings = self.GetFeedDataSettings(feed)
        someDataWasAdded = False

        if (feedDataSettings is None):
            logging.debug('GetAndParse => feedDataSettings is None: %s', feed)

        etag = getattr(feedDataSettings, 'new_etag', None)
        modified = getattr(feedDataSettings, 'new_modified', None)

        d = feedparser.parse(feed, etag=etag, modified=modified)
        logging.debug('parse feed entries: %s', len(d['entries']))
        
        items = []
        itemSize = sys.getsizeof(feedDataSettings.private_data)

        entriesCount = 0

        for e in d['entries']:
            di = {}

            di['link'] = getattr(e, 'link', 'THIS_WILL_HUNT_ME')
            di['id'] = str(hash(getattr(e, 'id', di['link']))) ## use hashlib.hexdigest?
           
            httpId = di['link']
            if httpId.startswith('https'):
                httpId = httpId.replace('https', 'http', 1)

            ## compare by id and by http link (some feeds keep generating radnom(?!?) http or https prefix thus the normalization)
            if feedDataSettings.latest_item_id == di['id']:
                if len(items) > 0:
                    self.AddSomeData(d, feed, items, feedDataSettings, False)
                    items = []
                    someDataWasAdded = True

                break

            if feedDataSettings.latest_http_link == httpId:
                if len(items) > 0:
                    self.AddSomeData(d, feed, items, feedDataSettings, False)
                    items = []
                    someDataWasAdded = True

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

            if hasattr(d, 'feed'):
                if hasattr(d['feed'], 'title'):
                    di['feedTitle'] = d['feed']['title']

            ##feedDataSettings.article_count = feedDataSettings.article_count + 1

            itemSize = itemSize + sys.getsizeof(di)
            if itemSize < 80000: ## todo more preciese calcs here
                items.append(di)
            else:
                self.AddSomeData(d, feed, items, feedDataSettings, True)
                itemSize = 0
                items = []
                someDataWasAdded = True

            entriesCount = entriesCount + 1
            if entriesCount > 100:
                ## well, just stop
                break

        if len(items) > 0:
            self.AddSomeData(d, feed, items, feedDataSettings, False)
            someDataWasAdded = True

        # if not someDataWasAdded:
        #     self.calcNextUpdateInterval(False)

    def AddSomeData(self, d, feed, items, feedDataSettings, createNew):
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



class MainHandler(BasicHandler):
    
    def get(self):
        user = users.get_current_user()

        if not user: ## NOT LOGGED IN
            html_template = 'html/hello.htm'
            template_values = {
                'login_url': users.create_login_url(self.request.uri)
            }
        else: ## LOGGED IN
            ud = self.GetAppUserByEmail(user.email())

            if ud is None:
                self.CreateFirstTimeUser(user)
                self.redirect('/')
                return

            if ud.isActive == False:
                logging.debug('user not active: %s', ud)
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
        

        self.response.headers['Content-Security-Policy'] = "script-src 'self'"
        self.response.headers['Content-Security-Policy'] = "style-src 'self'"
        self.response.headers['Content-Security-Policy'] = "object-src 'self'"

        self.response.out.write(template.render(template_values))


class CronFeedsHandler(BasicHandler):

    def getUrls(self, allFeeds):
        cacheKey = 'feed_data_settings___all'
        feeds = memcache.get(cacheKey)
        if (feeds is None):
            allFeedDataSettings = FeedDataSettings.query()
            feeds = [feed.url for feed in allFeedDataSettings];
            memcache.set(cacheKey, feeds, 3600) ## 1h
            logging.debug('adding allFeedDataSettings to cache. Size: %s', sys.getsizeof(feeds))

        return feeds if allFeeds else feeds[datetime.now().minute / 2::30] ## every 30th feed

    def get(self):
        urls = self.getUrls(self.request.get('allFeeds') == '1')
        for url in urls:
            taskqueue.add(queue_name='cron-feeds', url='/cronfeed', params={'url': url})

        logging.debug('tasks added: %s', len(urls))


class CronFeedHandler(BasicHandler):

    def GetCurrentDateTime(self):
        now = datetime.now()
        return now.strftime("%Y-%m-%d %H:%M")

    # def calcNextUpdateInterval(slef, feedWasUpdated):
    #     if feedWasUpdated:
    #         interval = feedDataSettings.lastUpdateInterval + (feedDataSettings.lastUpdateInterval / 10)
    #         feedDataSettings.updatesWithoutNewFeeds = 0
    #     else:
    #         interval = feedDataSettings.lastUpdateInterval - (feedDataSettings.lastUpdateInterval / 10)
    #         feedDataSettings.updatesWithoutNewFeeds = feedDataSettings.updatesWithoutNewFeeds + 1

    #     ## save orignal value for future references
    #     FeedDataSettings.lastUpdateInterval = interval
        
    #     ## one day max
    #     if interval > 86400:
    #         interval = 86400

    #     FeedDataSettings.updateMeAfterThisTime = datetime.now() + timedelta(seconds=interval)

    def post(self):
        feed = self.request.get('url')
        self.GetAndParse(feed, self.request.get('debug') == '1')
        self.response.out.write('ok') 

class FeedHandler(BasicHandler):

    def getNewFeedViaCron(self, feedUrl):
        feedUrl = 'http://' + self.request.host + '/cronfeed/' + feedUrl
        result = urllib.urlopen(feedUrl).read()

    def getFeedData(self, feedUrl, count):
        keyName = str(hash(feedUrl) * hash(feedUrl)) + '_' + str(count)

        feedDataSettings = self.GetFeedDataSettings(feedUrl)

        if feedDataSettings is None:
            logging.debug('getFeedData => feedDataSettings is None. Why?!? %s keyName', feedUrl, keyName)
        else:
            if count == '-1':
                feedData = feedDataSettings.private_data
                priorData = feedDataSettings.feedDataCount
            else: 
                fd = FeedData.get_by_id(keyName)
                feedData = fd.private_data
                priorData = int(count) - 1
            
        return feedData, keyName, priorData, feedDataSettings.article_count

    def getReadData(self, feedUrl, ud):
        readDataAttr = 'readData__' + str(feedUrl).translate(None, '.')
        readData = ReadData.get_by_id(readDataAttr)
        if readData is not None:
            return readData.readData, readData.readCount
        else:
            return '', 0

    def getStarData(self, feed_url, ud):
        starDataAttr = 'starData__' + str(feed_url.translate(None, '.'))
        starData = StarData.get_by_id(starDataAttr)
        return starData.starData if starData is not None else ''

    def get(self, feed_url):
        ## user
        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud is None:
                self.redirect('/403.html')

        feed_url = urllib.unquote_plus(feed_url)
        
        ## new feed
        newFeed = self.request.get('newFeed')
        if int(newFeed) == 1:
            self.getNewFeedViaCron(feed_url)

        ## pagination
        count = self.request.get('count')
        if (count is None):
            count = -1

        ## data
        feed_data, key_name, nextCount, article_count = self.getFeedData(feed_url, count)
        read_data, read_count = self.getReadData(feed_url, ud)
        star_data = self.getStarData(feed_url, ud)

        combined = {'feed': feed_data, 'read': read_data, 'feedIsRead': article_count <= read_count, 'read_count': read_count, 'article_count': article_count, 'star': star_data, 'key_name': key_name, 'nextcount': nextCount, 'ver': random.randrange(1,100000)}

        ## NB when logged in as admin, GAE changes these to cache-control: no-cache, must-revalidate. 
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "public, max-age=1800" ##30 minutes
        ##self.response.headers['Cache-Control'] = "private" ##30 minutes
        self.response.out.write(str(json.dumps(combined)))

class SaveSettingsHandler(BasicHandler):

    def addNewFeed(self, feedUrl):
        newFeed = False
        logging.debug('adding feed: %s', feedUrl)
        fds = FeedDataSettings.get_by_id(feedUrl)
        
        if fds is None:
            fds = FeedDataSettings(url=feedUrl, id=feedUrl, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
            newFeed = True
        else:
            fds.refCount = fds.refCount + 1

        self.GetAndParse(feedUrl, False)

        fds.put()
    
    def deleteFeed(self, feedUrl):
        logging.debug('deleting feed: %s', feedUrl)
        fds = FeedDataSettings.get_by_id(feedUrl)

        if fds is not None:
            fds.refCount = fds.refCount - 1
            logging.debug('deleting feed %s, refCount: %s', feedUrl, fds.refCount)
            if fds.refCount > 0:
                fds.put()
            else:
                fds.key.delete()

    def cronNewFeed(self, newFeed):
        import urllib
        logging.debug('triggering cronfeed for: ' + 'http://' + self.request.host + '/cronfeed/' + newFeed)
        urllib.urlopen('http://' + self.request.host + '/cronfeed/' + newFeed).read()

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud != None:
                data = self.request.get('data')

                newFeed = self.request.get('newFeed')
                if newFeed:
                    if self.addNewFeed(newFeed):
                        self.cronNewFeed(newFeed)


                deleteFeed = self.request.get('deleteFeed')
                if deleteFeed:
                    self.deleteFeed(deleteFeed)

                data = '{"username":"' + ud.app_username + '", ' + data[1:]
                ud.private_data = data
                ud.put()

                self.response.out.write("ok")

class MarkArticlesAsRead(BasicHandler):

    def getReadData(self, feedUrl):
        readDataAttr = 'readData__' + str(feedUrl).translate(None, '.')
        readData = ReadData.get_by_id(readDataAttr)
        if readData is None:
            readData = ReadData(app_username = self.ud.app_username, feedUrl = feedUrl, readData = '', readCount = 0, id = readDataAttr)

        return readData

    def findArticlesFromData(self, feedData):
        if feedData != '':
            articles = json.loads(feedData)
            return [article['id'] for article in articles]
        else:
            return []

    def findArticles(self, feedUrl, feedDataSettings):
        count = 1
        articlesToMarkAsRead = self.findArticlesFromData(feedDataSettings.private_data)

        while (count <= feedDataSettings.feedDataCount):
            fd = FeedData.get_by_id(str(hash(feedUrl) * hash(feedUrl)) + '_' + str(count))
            if fd.private_data is None:
                break

            articlesToMarkAsRead = articlesToMarkAsRead + self.findArticlesFromData(fd.private_data)
            count = count + 1

        return articlesToMarkAsRead

    def markAllRead(self):
        for feedUrl in self.data:

            feedUrl = urllib.unquote_plus(feedUrl)
            feedDataSettings = self.GetFeedDataSettings(feedUrl)

            readData = self.getReadData(feedUrl)
            readUntilNow = readData.readData.split(',')

            for readArticle in self.findArticles(feedUrl, feedDataSettings):
                if not str(readArticle) in readUntilNow:
                    readUntilNow.append(str(readArticle))

            readData.readData = ','.join(str(entry) for entry in readUntilNow)
            readData.readCount = len(readUntilNow) - 1
            readData.put()

            feedDataSettings.article_count = readData.readCount
            feedDataSettings.put()

            logging.debug('[READCOUNT DEBUG ALL] Set read count to: %s of %s (total article count: %s)', readData.readCount, feedUrl, feedDataSettings.article_count)
            self.response.out.write(str(json.dumps({'unreadCount': feedDataSettings.article_count - readData.readCount, 'feedUrl': feedUrl})))

    def markSingleArticleAsRead(self):
        feedUrl = self.data.keys()[0]
        readArticle = str(self.data[self.data.keys()[0]][0])
        if readArticle == '':
            return

        readData = self.getReadData(feedUrl)

        readUntilNow = readData.readData.split(',')
        if self.read:
            if not str(readArticle) in readUntilNow:
                readUntilNow.append(str(readArticle))
        else:
            readUntilNow.remove(str(readArticle))

        readData.readData = ','.join(str(entry) for entry in readUntilNow)
        readData.readCount = len(readUntilNow) - 1
        readData.put()

        self.response.out.write(str(json.dumps({'unreadCount': -1, 'feedUrl': feedUrl})))

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud != None:
                self.data = json.loads(self.request.get('data'))
                self.ud = ud
                self.read = self.request.get('read') == '1'

                if self.request.get('allRead') == '1':
                    self.markAllRead()
                else:
                    self.markSingleArticleAsRead()


class StarArticle(BasicHandler):

    def StarSingleArticle(self):
        feedUrl = self.data['feed']
        star = self.data['state'] == 1
        starArticle = self.data['id']
        if starArticle == '':
            return

        starDataAttr = 'starData__' + str(feedUrl).translate(None, '.')
        starData = StarData.get_by_id(starDataAttr)
        if starData is None:
            starData = StarData(app_username = self.ud.app_username, feedUrl = feedUrl, starData = '', id = starDataAttr)

        starUntilNow = starData.starData.split(',')
        if star:
            starUntilNow.append(starArticle)
        else:
            starUntilNow.remove(str(starArticle))

        starData.starData = ','.join(str(entry) for entry in starUntilNow)
        starData.put()

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            self.ud = self.GetAppUserByEmail(user.email())
            if self.ud != None:
                self.data = json.loads(self.request.get('data'))
                self.StarSingleArticle()
                self.response.out.write("ok")

class GetUserFeedsHandler(BasicHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud is not None:
                self.response.out.write(ud.private_data)

class GetUserReadDataHandler(BasicHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud is not None:  

                ## rebuild indexs
                # allFeedDataSettings = FeedDataSettings.query()
                # for feed in allFeedDataSettings:
                #     feed.url = feed.url
                #     feed.put()

                allUserRead = ReadData.query(ReadData.app_username == ud.app_username).fetch()

                ##data = [{'url': read.feedUrl, 'readCount': read.readCount} for read in allUserRead]
                ##data = [{read.feedUrl: {read: read.readCount} for read in allUserRead]

                data = {}

                for read in allUserRead:
                    data[read.feedUrl] = {
                        'readCount': read.readCount
                    }

                ##futures = [FeedDataSettings.query(FeedDataSettings.url == read.feedUrl).fetch_async(1) for read in allUserRead]
                futures = [FeedDataSettings.get_by_id_async(read.feedUrl) for read in allUserRead]

                ## todo:
                ## get read keys
                ## read mylti async
                ##fdss = [ndb.get_multi_async(for read in allUserRead]
                    # @ndb.tasklet
                    # def get_cart_plus_offers(acct):
                    #   cart, offers = yield get_cart_async(acct), get_offers_async(acct)
                    #   raise ndb.Return((cart, offers))
                    # https://developers.google.com/appengine/docs/python/ndb/async#using

                ## todo test keys only and then multy async
                # (70) 2014-05-26 14:15:05.645 "GET /GetUserReadData" 200 real=4603ms api=0ms overhead=201ms (139 RPCs, cost=28420, billed_ops=[DATASTORE_READ:406])
                # (71) 2014-05-26 14:15:01.630 "GET /GetUserReadData" 200 real=3819ms api=0ms overhead=201ms (139 RPCs, cost=28420, billed_ops=[DATASTORE_READ:406])
                # (72) 2014-05-26 14:14:57.326 "GET /GetUserReadData" 200 real=4030ms api=0ms overhead=196ms (139 RPCs, cost=28420, billed_ops=[DATASTORE_READ:406])
                # (73) 2014-05-26 14:14:52.344 "GET /GetUserReadData" 200 real=4707ms api=0ms overhead=134ms (139 RPCs, cost=28420, billed_ops=[DATASTORE_READ:406])

                # (1)  2014-05-26 14:50:43.065 "GET /GetUserReadData" 200 real=737ms api=0ms overhead=2ms (3 RPCs, cost=9520, billed_ops=[DATASTORE_READ:136])
                # (2)  2014-05-26 14:50:41.645 "GET /GetUserReadData" 200 real=781ms api=0ms overhead=4ms (3 RPCs, cost=9520, billed_ops=[DATASTORE_READ:136])
                # (3)  2014-05-26 14:50:39.951 "GET /GetUserReadData" 200 real=859ms api=0ms overhead=4ms (3 RPCs, cost=9520, billed_ops=[DATASTORE_READ:136])
                # (4)  2014-05-26 14:50:38.157 "GET /GetUserReadData" 200 real=856ms api=0ms overhead=5ms (3 RPCs, cost=9520, billed_ops=[DATASTORE_READ:136])                 

                for future in futures:
                    fds = future.get_result()
                    if fds is not None:
                        data[fds.url]['totalCount'] = fds.article_count
                    else: 
                        logging.debug('empty future %s', future)

                self.response.out.write(str(json.dumps(data)))

class GetUserArticleCountHandler(BasicHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud is not None:
                
                allUserRead = FeedData.query(ReadData.app_username == ud.app_username).fetch()

                ##data = [{'url': read.feedUrl, 'readCount': read.readCount} for read in allUserRead]
                data = [{read.feedUrl: read.readCount} for read in allUserRead]

                self.response.out.write(str(json.dumps(data)))


class UploadOPMLHandler(blobstore_handlers.BlobstoreUploadHandler):

    def addFeedToDataStore(self, feedUrl):
        fds = FeedDataSettings.get_by_id(feedUrl)
        if fds is None:
            fds = FeedDataSettings(url=feedUrl, id=feedUrl, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        else:
            fds.refCount = fds.refCount + 1

        logging.debug('adding feed to data store %s, refCount: %s', feedUrl, fds.refCount)

        fds.put()

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
        addedFeeds = 0 ##add first 50 feeds for processing, the rest -will be processed when requested
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
        ud = self.GetAppUserByEmail(user.email())

        ## save new data
        ud.private_data = '{"username":"' + ud.app_username + '", "bloglist":{ ' + self.importedBlogList + ' }}'
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

APP_ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

ROUTES = [
    ('/403.html', UnauthorizedHandler),
    ('/404.html', NotFoundHandler),

    ('/GetUserFeeds', GetUserFeedsHandler),
    ('/GetUserReadData', GetUserReadDataHandler),
    
    ('/SaveSettings',SaveSettingsHandler),
    ('/MarkArticlesAsRead',MarkArticlesAsRead),
    ('/StarArticle',StarArticle),

    ('/cronfeeds', CronFeedsHandler),
    ('/cronfeed', CronFeedHandler),
    ('/feed/(.*)', FeedHandler),
    
    ('/uploadOPML', UploadOPMLHandler),
    ('/redirect', RedirectHandler),

    ('/', MainHandler)
]

app = webapp2.WSGIApplication(ROUTES, debug=DEBUG)
