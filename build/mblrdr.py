#!/usr/bin/env python
# -*- coding: utf-8 -*-

# TODO
# 3. cron user - keep track of feed usasge and decrease/increase cron times
# 5. star folder
# 6. move from hash to somelib.hash
# 8. @ndb.transactional , async, dont wait urlopen requests

#  https://github.com/julien-maurel/jQuery-Storage-API
#  redirects https://github.com/ether/etherpad-lite/issues/1603

import os
import sys

from jinja2 import Environment, FileSystemLoader
jinja_environment = Environment(
    loader=FileSystemLoader(os.path.dirname(__file__)))

import webapp2

from google.appengine.api import users
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import ndb
from google.appengine.api import taskqueue

import urllib
import json
import logging
from datetime import datetime
import random

from py.ext import urlnorm
from py.common.db_models import UserData
from py.common.db_models import ReadData
from py.common.db_models import StarData
from py.common.db_models import FeedData
from py.common.db_models import FeedDataSettings
from py.common.parser import GetAndParse
from py.common.parser import GetFeedDataSettings
from py.common.utils import *


def isReadOnly(user):
    return hasattr(user, 'demo') and user.demo

class MainHandler(webapp2.RequestHandler):

    @ndb.toplevel
    def get(self):
        user = users.get_current_user()

        if not user:  # NOT LOGGED IN
            html_template = 'html/hello.htm'
            template_values = {
                'login_url': users.create_login_url(self.request.uri)
            }
        else:  # LOGGED IN
            ud = GetAppUserByEmail(user.email())

            if ud is None:
                # all new users are demo users
                CreateFirstTimeUser(user, True)
                self.redirect('/')
                return

            if ud.isActive is False:
                logging.debug('user not active: %s', ud.app_username)
                html_template = 'html/hello.htm'
                template_values = {
                    'login_url': users.create_login_url(self.request.uri),
                    'waiting': 'Waiting for activation'
                }
            else:
                upload_url = blobstore.create_upload_url('/uploadOPML')
                html_template = 'html/index.react.html'

                template_values = {
                    'logout': users.create_logout_url(self.request.uri),
                    'upload_url': upload_url
                }

                logging.debug('MainHandler for user: %s', ud.app_username)

        template = jinja_environment.get_template(html_template)
        self.response.headers['Content-Type'] = 'text/html'

        self.response.headers['Content-Security-Policy'] = "script-src 'self'"
        self.response.headers['Content-Security-Policy'] = "style-src 'self'"
        self.response.headers['Content-Security-Policy'] = "object-src 'self'"

        self.response.out.write(template.render(template_values))


class FeedHandler(webapp2.RequestHandler):

    def getFeedData(self, feedUrl, count):
        keyName = str(hash(feedUrl) * hash(feedUrl)) + '_' + str(count)

        feedDataSettings = GetFeedDataSettings(feedUrl)

        if feedDataSettings is None:
            logging.debug(
                'getFeedData => feedDataSettings is None. Why?!? %s keyName', feedUrl, keyName)
        else:
            if count == '-1':
                feedData = feedDataSettings.private_data
                priorData = feedDataSettings.feedDataCount
            else:
                fd = FeedData.get_by_id(keyName)
                if fd is None:
                    logging.debug('getFeedData => fd is None. Why?!?')
                    # ' %s keyName, feedUrl: ', keyName, feedUrl)
                    feedData = ''
                else:
                    feedData = fd.private_data
                priorData = int(count) - 1
                if count == '-1':
                    count = -2

        return feedData, keyName, priorData, feedDataSettings.article_count

    def getReadData(self, feedUrl, ud):
        readDataAttr = 'readData__' + ud.app_username + \
            '__' + str(feedUrl).translate(None, '.')
        readData = ReadData.get_by_id(readDataAttr)
        if readData is not None:
            return readData.readData, readData.readCount
        else:
            return '', 0

    def getStarData(self, feed_url, ud):
        starDataAttr = 'starData__' + ud.app_username + \
            '__' + str(feed_url.translate(None, '.'))
        starData = StarData.get_by_id(starDataAttr)
        return starData.starData if starData is not None else ''

    def get(self, feed_url):
        # user
        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is None:
                self.redirect('/403.html')

        feed_url = urllib.unquote_plus(feed_url)

        # pagination
        count = self.request.get('count')
        if (count is None):
            count = -1

        # data
        feed_data, key_name, nextCount, article_count = self.getFeedData(
            feed_url, count)
        read_data, read_count = self.getReadData(feed_url, ud)
        star_data = self.getStarData(feed_url, ud)

        combined = {'feed': feed_data, 'read': read_data, 'feedIsRead': article_count <= read_count, 'read_count': read_count,
                    'article_count': article_count, 'star': star_data, 'key_name': key_name, 'nextcount': nextCount, 'ver': random.randrange(1, 100000)}

        # NB when logged in as admin, GAE changes these to cache-control:
        # no-cache, must-revalidate.
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers[
            'Cache-Control'] = "public, max-age=1800"  # 30 minutes
        # self.response.headers['Cache-Control'] = "private" ##30 minutes
        self.response.out.write(str(json.dumps(combined)))


class SaveSettingsHandler(webapp2.RequestHandler):

    def addNewFeed(self, feedUrl):
        logging.debug('adding feed: %s', feedUrl)
        fds = FeedDataSettings.get_by_id(feedUrl)

        if fds is None:
            fds = FeedDataSettings(url=feedUrl, id=feedUrl, article_count=0,
                                   feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
            fds.put(use_cache=False, use_memcache=False)  # !
            logging.debug('adding feed, fds is None: %s', feedUrl)
            GetAndParse(feedUrl, False, fds)
        else:
            fds.refCount = fds.refCount + 1
            fds.put()

    def deleteFeed(self, feedUrl):
        logging.debug('deleting feed: %s', feedUrl)
        fds = FeedDataSettings.get_by_id(feedUrl)

        if fds is not None:
            fds.refCount = fds.refCount - 1
            logging.debug(
                'deleting feed %s, refCount: %s', feedUrl, fds.refCount)
            if fds.refCount > 0:
                fds.put()
            else:
                fds.key.delete()

    def cronNewFeed(self, newFeed):
        import urllib
        logging.debug('triggering cronfeed for: ' + 'http://' +
                      self.request.host + '/cronfeed/' + newFeed)
        urllib.urlopen(
            'http://' + self.request.host + '/cronfeed/' + newFeed).read()

        feedUrl = 'http://' + self.request.host + '/cronfeed/' + feedUrl
        urllib.urlopen(feedUrl).read()

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is not None:

                if isReadOnly(ud):
                    self.response.out.write("ok")
                    return

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


class MarkArticlesAsRead(webapp2.RequestHandler):

    def getReadData(self, feedUrl):
        readDataAttr = 'readData__' + self.ud.app_username + \
            '__' + str(feedUrl).translate(None, '.')
        readData = ReadData.get_by_id(readDataAttr)
        if readData is None:
            readData = ReadData(app_username=self.ud.app_username, feedUrl=feedUrl, readData='', readCount=0, id=readDataAttr)
            readData.put()

        return readData

    def findArticlesFromFeedData(self, feedData):
        articles = json.loads(feedData)
        return [article['id'] for article in articles]

    def findArticles(self, feedUrl, feedDataSettings):
        feedDataCount = 1
        articlesToMarkAsRead = self.findArticlesFromFeedData(
            feedDataSettings.private_data)

        while (feedDataCount <= feedDataSettings.feedDataCount):
            id = str(hash(feedUrl) * hash(feedUrl)) + '_' + str(feedDataCount)
            # memory hog otherwise!!!
            fd = FeedData.get_by_id(id, use_cache=False, use_memcache=False)
            if fd.private_data is not None and fd.private_data != '':
                articlesToMarkAsRead = articlesToMarkAsRead + \
                    self.findArticlesFromFeedData(fd.private_data)

            feedDataCount = feedDataCount + 1

        return articlesToMarkAsRead

    def markAllRead(self):
        for feedUrl in self.data:
            feedUrl = urllib.unquote_plus(feedUrl)
            feedDataSettings = GetFeedDataSettings(feedUrl)

            readData = self.getReadData(feedUrl)
            readUntilNow = readData.readData.split(',')

            for readArticle in self.findArticles(feedUrl, feedDataSettings):
                if not str(readArticle) in readUntilNow:
                    readUntilNow.append(str(readArticle))

            # cleanup bad data,
            # some entries have lots of repeats in readUntilNow for some reason, clean it here
            # by deduplicating the list with the next two line of py magic:
            logging.debug(
                '[READCOUNT DEBUG ALL] length before cleanup: %s', len(readUntilNow))
            readUntilNow = list(set(readUntilNow))
            logging.debug(
                '[READCOUNT DEBUG ALL] length after cleanup: %s', len(readUntilNow))

            readData.readData = ','.join(str(entry) for entry in readUntilNow)
            readData.readCount = len(readUntilNow) - 1
            readData.put()

            feedDataSettings.article_count = readData.readCount
            feedDataSettings.put()

            logging.debug('[READCOUNT DEBUG ALL] Set read count to: %s of %s (total article count: %s)',
                          readData.readCount, feedUrl, feedDataSettings.article_count)
            self.response.out.write(str(json.dumps(
                {'unreadCount': feedDataSettings.article_count - readData.readCount, 'feedUrl': feedUrl})))

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

        self.response.out.write(
            str(json.dumps({'unreadCount': -1, 'feedUrl': feedUrl})))

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is not None:

                if isReadOnly(ud):

                    if self.request.get('allRead') == '1':
                        unreadCount = 0
                    else:
                        unreadCount = -1

                    self.data = json.loads(self.request.get('data'))
                    self.response.out.write(str(json.dumps(
                        {
                            'unreadCount': unreadCount,
                            'feedUrl': self.data.keys()[0]
                        }
                    )))

                    return

                self.data = json.loads(self.request.get('data'))
                self.ud = ud
                self.read = self.request.get('read') == '1'

                if self.request.get('allRead') == '1':
                    self.markAllRead()
                else:
                    self.markSingleArticleAsRead()


class StarArticle(webapp2.RequestHandler):

    def StarSingleArticle(self):
        feedUrl = self.data['feed']
        star = self.data['state'] == 1
        starArticle = self.data['id']
        if starArticle == '':
            logging.debug('No starArticle data. returning')
            return

        starDataAttr = 'starData__' + self.ud.app_username + \
            '__' + str(feedUrl).translate(None, '.')
        starData = StarData.get_by_id(starDataAttr)
        if starData is None:
            starData = StarData(
                app_username=self.ud.app_username, feedUrl=feedUrl,
                starData='', id=starDataAttr)

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
            self.ud = GetAppUserByEmail(user.email())
            if self.ud is not None:

                if isReadOnly(ud):
                    self.response.out.write("ok")
                    return

                self.data = json.loads(self.request.get('data'))
                self.StarSingleArticle()
                self.response.out.write("ok")


class GetUserFeedsHandler(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is not None:
                self.response.out.write(ud.private_data)


class GetUserReadDataHandler(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is not None:

                # rebuild indexs
                # allFeedDataSettings = FeedDataSettings.query()
                # for feed in allFeedDataSettings:
                #     feed.url = feed.url
                #     feed.put()

                allUserRead = ReadData.query(
                    ReadData.app_username == ud.app_username).fetch()

                #data = [{'url': read.feedUrl, 'readCount': read.readCount} for read in allUserRead]
                # data = [{read.feedUrl: {read: read.readCount} for read in
                # allUserRead]

                data = {}

                for read in allUserRead:
                    data[read.feedUrl] = {
                        'readCount': read.readCount
                    }

                #futures = [FeedDataSettings.query(FeedDataSettings.url == read.feedUrl).fetch_async(1) for read in allUserRead]
                futures = [FeedDataSettings.get_by_id_async(
                    read.feedUrl) for read in allUserRead]

                # todo:
                # get read keys
                # read mylti async
                # fdss = [ndb.get_multi_async(for read in allUserRead]
                # @ndb.tasklet
                # def get_cart_plus_offers(acct):
                #   cart, offers = yield get_cart_async(acct), get_offers_async(acct)
                #   raise ndb.Return((cart, offers))
                # https://developers.google.com/appengine/docs/python/ndb/async#using

                # todo test keys only and then multy async
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


class GetUserArticleCountHandler(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Cache-Control'] = "private, max-age=0"

        user = users.get_current_user()
        if user:
            ud = GetAppUserByEmail(user.email())
            if ud is not None:

                allUserRead = FeedData.query(
                    ReadData.app_username == ud.app_username).fetch()

                ##data = [{'url': read.feedUrl, 'readCount': read.readCount} for read in allUserRead]
                data = [{read.feedUrl: read.readCount} for read in allUserRead]

                self.response.out.write(str(json.dumps(data)))


class UploadOPMLHandler(blobstore_handlers.BlobstoreUploadHandler):

    def addFeedToDataStore(self, feedUrl):
        fds = FeedDataSettings.get_by_id(feedUrl)
        if fds is None:
            fds = FeedDataSettings(url=feedUrl, id=feedUrl, article_count=0,
                                   feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        else:
            fds.refCount = fds.refCount + 1

        logging.debug(
            'adding feed to data store %s, refCount: %s', feedUrl, fds.refCount)

        fds.put()

    def addFeedToBlogList(self, folder, feed, title):
        title = title.replace('"', '\\"')

        try:
            folderUrls = [f['url'] for f in self.bloglist[folder]]
        except KeyError:
            self.bloglist[folder] = []
            folderUrls = []

        feedShouldBeAdded = False
        try:
            i = folderUrls.index(feed)
        except ValueError:
            feedShouldBeAdded = True

        if feedShouldBeAdded:
            self.bloglist[folder].append({'url': feed, 'title': title})

    def processOutline(self, outline, currentFolder):
        logging.debug('processing folder: %s ', currentFolder)
        for item in outline:
            if (not hasattr(item, 'xmlUrl') and (hasattr(item, 'text') or hasattr(item, 'title'))):
                folder = item
                title = getattr(item, 'text', None) or getattr(
                    item, 'title', None)
                self.processOutline(folder, title)
            elif hasattr(item, 'xmlUrl'):

                if hasattr(item, 'title'):
                    title = getattr(item, 'title', None)
                else:
                    title = urlnorm.normalize(item.xmlUrl)

                self.addFeedToBlogList(
                    currentFolder, urlnorm.normalize(item.xmlUrl), title)
                self.addFeedToDataStore(urlnorm.normalize(item.xmlUrl))

    def post(self):
        user = users.get_current_user()
        if not user:
            self.redirect('/')

        from google.appengine.ext import blobstore
        import opml

        # get file
        upload_files = self.get_uploads('file')
        blob_info = upload_files[0]
        blob_reader = blobstore.BlobReader(blob_info.key())
        opmlFile = blob_reader.read()

        # get user
        ud = GetAppUserByEmail(user.email())
        private_data = json.loads(ud.private_data)
        self.bloglist = private_data['bloglist']

        # parse file
        outline = opml.from_string(opmlFile)
        self.processOutline(outline, 'root')

        # save new data
        private_data['bloglist'] = self.bloglist
        ud.private_data = json.dumps(private_data)
        ud.put()

        logging.debug('imported blog list: %s', json.dumps(self.bloglist))

        self.redirect('/')


class UnauthorizedHandler(webapp2.RequestHandler):

    def get(self):
        self.error(403)
        self.response.out.write(
            "mobile reader says:  nothing here. Coming soon:  Cooler nothinghere page!")


class NotFoundHandler(webapp2.RequestHandler):

    def get(self):
        self.error(404)


class RedirectHandler(webapp2.RequestHandler):

    def get(self):
        user = users.get_current_user()
        if not user:
            self.redirect('/')

        # todo https://github.com/ether/etherpad-lite/issues/1603
        url = self.request.get('url')
        self.redirect(str(url), True)


class GenerateUploadUrlHandler(webapp2.RequestHandler):

    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(upload_url)


APP_ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

ROUTES = [
    ('/403.html', UnauthorizedHandler),
    ('/404.html', NotFoundHandler),

    ('/GetUserFeeds', GetUserFeedsHandler),
    ('/GetUserReadData', GetUserReadDataHandler),

    ('/SaveSettings', SaveSettingsHandler),
    ('/MarkArticlesAsRead', MarkArticlesAsRead),
    ('/StarArticle', StarArticle),

    ('/feed/(.*)', FeedHandler),

    ('/uploadOPML', UploadOPMLHandler),
    ('/redirect', RedirectHandler),

    ('/GenerateUploadUrl', GenerateUploadUrlHandler),

    ('/', MainHandler),
]

app = webapp2.WSGIApplication(ROUTES, debug=DEBUG)
