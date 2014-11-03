import os, sys
import urllib
import logging
from datetime import datetime
import json

from py.ext import feedparser

from py.common.utils import *


def GetAndParse(feed, debug, feedDataSettings):
    a1 = datetime.now()
    feed = urllib.unquote_plus(feed) ## because of encodeURIComponent
    if feedDataSettings is None:
        feedDataSettings = GetFeedDataSettings(feed)
    someDataWasAdded = False

    if (feedDataSettings is None):
        logging.debug('GetAndParse => feedDataSettings is None: %s', feed)

    etag = getattr(feedDataSettings, 'new_etag', None)
    modified = getattr(feedDataSettings, 'new_modified', None)

    a = datetime.now()
    d = feedparser.parse(feed, etag=etag, modified=modified)
    b = datetime.now()
    c = b - a;
    logging.debug('parse (%s) entries for %s', len(d['entries']), feed)
    logging.debug('parsing took %s seconds', c.seconds)


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
                AddSomeData(d, feed, items, feedDataSettings, False)
                items = []
                someDataWasAdded = True

            break

        if feedDataSettings.latest_http_link == httpId:
            if len(items) > 0:
                AddSomeData(d, feed, items, feedDataSettings, False)
                items = []
                someDataWasAdded = True

            break

        di['title'] = getattr(e, 'title', '')
        di['author'] = getattr(e, 'author', '')

        try:  di['published'] = e.published
        except: di['published'] = GetCurrentDateTime()

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
            AddSomeData(d, feed, items, feedDataSettings, True)
            itemSize = 0
            items = []
            someDataWasAdded = True

        entriesCount = entriesCount + 1
        if entriesCount > 100:
            ## well, just stop
            break

    if len(items) > 0:
        AddSomeData(d, feed, items, feedDataSettings, False)
        someDataWasAdded = True

    b1 = datetime.now()
    c1 = b1 - a1
    logging.debug('GetAndParse took %s seconds', c1.seconds)

    # if not someDataWasAdded:
    #     self.calcNextUpdateInterval(False)
