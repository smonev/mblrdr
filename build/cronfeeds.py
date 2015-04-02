import os, sys
import webapp2
import logging
from datetime import datetime

from google.appengine.api import memcache
from google.appengine.api import taskqueue

from py.common.utils import FeedDataSettings
from py.common.parser import GetAndParse

class CronFeedsHandler(webapp2.RequestHandler):

    def getUrls(self, allFeeds):
        cacheKey = 'feed_data_settings___all'
        feeds = memcache.get(cacheKey)
        if (feeds is None):
            allFeedDataSettings = FeedDataSettings.query()
            feeds = [feed.url for feed in allFeedDataSettings];
            memcache.set(cacheKey, feeds, 3600) ## 1h
            logging.debug('adding allFeedDataSettings to cache. Count: %s', len(feeds))

        ##return feeds if allFeeds else feeds[datetime.now().minute / 1::60] ## every 20th feed
        ##return feeds if allFeeds else feeds[datetime.now().minute / 30::2] ## every 2nd feed
        return feeds

    def get(self):
        logging.debug('getting urls 2')
        urls = self.getUrls(self.request.get('allFeeds') == '1')
        for url in urls:
            taskqueue.add(queue_name='cron-feeds', url='/cronfeed', params={'url': url})

        logging.debug('tasks added: %s', len(urls))


class CronFeedHandler(webapp2.RequestHandler):

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
    #     if interval > 86800:
    #         interval = 86400

    #     FeedDataSettings.updateMeAfterThisTime = datetime.now() + timedelta(seconds=interval)

    def post(self):
        feed = self.request.get('url')
        GetAndParse(feed, self.request.get('debug') == '1', None)
        self.response.out.write('ok')

    def get(self):
        feed = self.request.get('url')
        GetAndParse(feed, self.request.get('debug') == '1', None)
        self.response.out.write('ok')

APP_ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Dev')

ROUTES = [
    ('/cronfeeds', CronFeedsHandler),
    ('/cronfeed', CronFeedHandler),
]

app = webapp2.WSGIApplication(ROUTES, debug=DEBUG)
