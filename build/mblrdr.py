#!/usr/bin/env python
# -*- coding: utf-8 -*-

## TODO
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
    url = ndb.StringProperty(required=True, indexed=False)
    new_etag = ndb.StringProperty(indexed=False)
    new_modified = ndb.StringProperty(indexed=False)
    article_count = ndb.IntegerProperty(indexed=False)
    latest_item = ndb.StringProperty(indexed=False)
    feedDataCount = ndb.IntegerProperty(indexed=False)
    private_data = ndb.TextProperty(indexed=False)
    latest_item_id = ndb.StringProperty(indexed=False)
    latest_http_link = ndb.StringProperty(indexed=False) ##latest item, normalized to http - i.e https://foo.bar becomes http://foo.bar
    refCount = ndb.IntegerProperty(indexed=False)

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

        return fds

    def GetCurrentDateTime(self):
        now = datetime.now()
        return now.strftime("%Y-%m-%d %H:%M")

    def AddSomeData(self, d, feed, items, feedDataSettings, createNew):
        ## http://devblog.miumeet.com/2012/06/storing-json-efficiently-in-python-on.html
        ## RequestTooLargeError  http://stackoverflow.com/questions/5022725/how-do-i-measure-the-memory-usage-of-an-object-in-python

        logging.debug('add some data: %s', feed)

        newItemsCount = len(items)

        if feedDataSettings.private_data <> '':
            oldData = json.loads(feedDataSettings.private_data)
            items = items + oldData

        feedDataSettings.private_data = json.dumps(items)

        ## remember what has been added, and do not add same data
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

        logging.debug('[READCOUNT DEBUG] Increase read count of %s to %s, createNew: %s', feed, feedDataSettings.article_count, createNew)
        feedDataSettings.put()


    def GetAndParse(self, feed, debug):
        feed = urllib.unquote_plus(feed) ## because of encodeURIComponent
        feedDataSettings = self.GetFeedDataSettings(feed)

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

                break

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

            entriesCount = entriesCount + 1
            if entriesCount > 100:
                ## well, just stop
                break

        if len(items) > 0:
            self.AddSomeData(d, feed, items, feedDataSettings, False)


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
        self.response.out.write(template.render(template_values))

class CronFeedsHandler(BasicHandler):

    def getUrls(self, allFeeds):
        feeds = [u'http://174.129.28.157/feed/', u'http://33bits.org/feed/', u'http://appengine-cookbook.appspot.com/feeds', u'http://artsbeat.blogs.nytimes.com/tag/mad-men-watch/feed/', u'http://aspn.activestate.com/ASPN/Cookbook/Python/index_rss', u'http://awesomepeoplehangingouttogether.tumblr.com/rss', u'http://beta.dailycolorscheme.com/feed/rss', u'http://bg-bg.facebook.com/feeds/page.php?id=184792058258487&format=atom10', u'http://bijansabet.com/rss', u'http://blog.codeclub.org.uk/blog/feed/', u'http://blog.distimo.com/category/android-market/feed/', u'http://blog.floxee.com/rss', u'http://blog.how-to-web.net/feed/', u'http://blog.ianbicking.org/feed/atom/', u'http://blog.kickstarter.com/rss/', u'http://blog.makezine.com/archive/make_store/index.xml', u'http://blog.musiclessons.bg/?feed=rss2', u'http://blog.notdot.net/feeds/atom.xml', u'http://blog.notifo.com/rss.xml', u'http://blog.peio.org/?feed=rss2', u'http://blog.rightscale.com/feed/', u'http://blog.thenounproject.com/rss', u'http://blogs.msdn.com/dthorpe/rss.xml', u'http://blogs.msdn.com/rssteam/rss.xml', u'http://blorn.com/rss', u'http://boyscoutmag.com/feed/', u'http://bunnylava.blogspot.com/feeds/posts/default', u'http://burakkanber.com/blog/feed/', u'http://calendar.perfplanet.com/feed/', u'http://capital-risqueur.blogspot.com/feeds/posts/default', u'http://cdixon.org/?feed=rss2', u'http://code.google.com/feeds/p/asynctools/issueupdates/basic', u'http://code.google.com/feeds/p/django-firebird/issueupdates/basic', u'http://corporateyouth.org/?feed=rss', u'http://coupland.blogs.nytimes.com/atom.xml', u'http://cracking-the-code.blogspot.com/feeds/posts/default', u'http://cvyk.blogspot.com/atom.xml', u'http://dekstop.de/weblog/index.xml', u'http://denitsa33.blogspot.com/feeds/posts/default?alt=rss', u'http://detskiknigi.com/feed/', u'http://dima.kalifish.com/?feed=rss2', u'http://dni.li/feed/', u'http://dunelmtechnology.co.uk/feed/', u'http://dzver.com/blog/?feed=rss2', u'http://edenflamingo.com/feed/', u'http://emurry.com/blog/feed/', u'http://essme.blogspot.com/feeds/posts/default?alt=rss', u'http://feedproxy.google.com/eenk', u'http://feedproxy.google.com/nettuts', u'http://feeds.dantup.com/DanTup', u'http://feeds.feedburner.com/AppEngineFan', u'http://feeds.feedburner.com/BonjourMadame', u'http://feeds.feedburner.com/BuzzMachine', u'http://feeds.feedburner.com/CityKidsbg', u'http://feeds.feedburner.com/DataMining', u'http://feeds.feedburner.com/Designknigoizdavane', u'http://feeds.feedburner.com/GeorgiNedelchevMonitoring', u'http://feeds.feedburner.com/GoogleAppEngineBlog', u'http://feeds.feedburner.com/InformationIsBeautiful', u'http://feeds.feedburner.com/Inkzee', u'http://feeds.feedburner.com/JeremiahGrossman', u'http://feeds.feedburner.com/JoshuaSchachter', u'http://feeds.feedburner.com/ModernLifeIsRubbish', u'http://feeds.feedburner.com/ServiceLevelAutomation', u'http://feeds.feedburner.com/SinticaEN', u'http://feeds.feedburner.com/Startup2Startup', u'http://feeds.feedburner.com/TheGrifters', u'http://feeds.feedburner.com/TheItRoom', u'http://feeds.feedburner.com/TheStartupFoundry', u'http://feeds.feedburner.com/TheUniversalGadget', u'http://feeds.feedburner.com/WSwI', u'http://feeds.feedburner.com/WhatAssociationBlog', u'http://feeds.feedburner.com/WhitehatSecurityBlog', u'http://feeds.feedburner.com/WorkHappy', u'http://feeds.feedburner.com/YlasticBlog', u'http://feeds.feedburner.com/alexanderkirk', u'http://feeds.feedburner.com/blogspot/OGBVh', u'http://feeds.feedburner.com/brettaylor', u'http://feeds.feedburner.com/carpeaqua', u'http://feeds.feedburner.com/catonmat', u'http://feeds.feedburner.com/crunchnotes', u'http://feeds.feedburner.com/directededge', u'http://feeds.feedburner.com/errorceptionBlog', u'http://feeds.feedburner.com/fastcompany/scobleizer', u'http://feeds.feedburner.com/garrettdimoncom', u'http://feeds.feedburner.com/georgiangelov', u'http://feeds.feedburner.com/iwdrm?format=xml', u'http://feeds.feedburner.com/john-nousis', u'http://feeds.feedburner.com/littlebigdetails', u'http://feeds.feedburner.com/mcsweeneys', u'http://feeds.feedburner.com/re-winder/feed', u'http://feeds.feedburner.com/reklama', u'http://feeds.feedburner.com/relevance-llc', u'http://feeds.feedburner.com/startupcompanylawyer', u'http://feeds.feedburner.com/startupping', u'http://feeds.feedburner.com/takaitaka2', u'http://feeds.feedburner.com/thesassway', u'http://feeds.feedburner.com/trendsspotting-feeds', u'http://feeds.feedburner.com/ubervu', u'http://feeds.feedburner.com/united-coders', u'http://feeds.infosthetics.com/infosthetics', u'http://feeds.simonwillison.net/swn-entries', u'http://feeds.sparkabout.net/sparkabout', u'http://feeds.venturehacks.com/venturehacks', u'http://feeds2.feedburner.com/LouisgraycomLive', u'http://feeds2.feedburner.com/Luckyrobotcom-GerryCampbell', u'http://feeds2.feedburner.com/StartupsInTurkey', u'http://feeds2.feedburner.com/asert/', u'http://feeds2.feedburner.com/bradburnham', u'http://feeds2.feedburner.com/openfund', u'http://feeds2.feedburner.com/startup/lessons/learned', u'http://fitsnstarts.tumblr.com/rss', u'http://friendfeed.com/gaberivera?format=atom', u'http://fusible.com/feed/', u'http://fxshaw.wordpress.com/feed/', u'http://gamedev.stackexchange.com/feeds/tag/html5', u'http://glasshouse.waggeneredstrom.com/blogs/frankshaw/rss.aspx', u'http://gloriapetkova.blogspot.com/feeds/posts/default?alt=rss', u'http://gradinadetelina.blogspot.com/feeds/posts/default?alt=rss', u'http://grigorweblog.wordpress.com/feed/', u'http://groups.google.com/group/get-theinfo/feed/rss_v2_0_msgs.xml', u'http://groups.google.com/group/google-appengine-downtime-notify/feed/rss_v2_0_msgs.xml', u'http://headrush.typepad.com/creating_passionate_users/index.rdf', u'http://ibdeveloper.blogspot.com/feeds/posts/default', u'http://ikonomika.org/?feed=rss2', u'http://ivanbedrov.com/?feed=rss2', u'http://jobs.37signals.com/categories/2/jobs.rss', u'http://joehewitt.com/index.xml', u'http://k1tesurf.com/main/component/option,com_rss/feed,RSS2.0/no_html,1/lang,en/', u'http://kanyewesanderson.tumblr.com/rss', u'http://krisibeta.tumblr.com/rss', u'http://krokotak.com/feed/', u'http://launchub.com/blog/?feed=rss2', u'http://levosgien.net/feed/', u'http://lifehacker.com/tag/android/index.xml', u'http://littlebits.cc/feed', u'http://ljato.wordpress.com/feed/', u'http://loveandtheft.org/feed/', u'http://lundxy.com/?feed=rss2', u'http://lydblog.wordpress.com/feed/', u'http://metaoptimize.com/blog/feed/', u'http://mhlegal.eu/bgblog/feed/', u'http://mightbwrong.tumblr.com/rss', u'http://milenafuchedjieva.blogspot.com/feeds/posts/default', u'http://mymilktoof.blogspot.com/feeds/posts/default', u'http://nellyo.wordpress.com/feed/', u'http://news.netcraft.com/feed/', u'http://nslatinski.org/?q=bg/rss.xml', u'http://odeqlo.wordpress.com/feed/', u'http://okdork.com/feed/rss', u'http://omis.me/feed/', u'http://open.blogs.nytimes.com/atom.xml', u'http://particletree.com/rss/', u'http://pavel-yanchev.blogspot.com/feeds/posts/default', u'http://pavlinav.wordpress.com/feed/', u'http://plovediv.com/feed', u'http://pomstar.org/rss', u'http://python-history.blogspot.com/feeds/posts/default?alt=rss', u'http://radankanev.blogspot.com/feeds/posts/default?alt=rss', u'http://reyk.tumblr.com/rss', u'http://rss.babble.com/babblenewthisweek/', u'http://rss.groups.yahoo.com/group/firebird-python/rss', u'http://rss.searchyc.com/techmeme?sort=by_date', u'http://scobleizer.posterous.com/rss.xml', u'http://search.twitter.com/search.atom?q=ececars', u'http://search.twitter.com/search.atom?q=smonev', u'http://seoblackhat.com/feed', u'http://shop.studioreforma.com/?feed=rss2', u'http://showmedo.com/latestVideoFeed/rss2.0?tag=python', u'http://simeons.wordpress.com/feed/', u'http://simoivanov.com/feed', u'http://songibson.wordpress.com/feed/', u'http://soroush.secproject.com/blog/feed/', u'http://sredparcalkitevshkafa.blogspot.com/feeds/posts/default?alt=rss', u'http://stackoverflow.com/feeds/tag?tagnames=translate3d&sort=newest', u'http://stallman.org/rss/rss.xml', u'http://status.blogrolling.com/rss', u'http://svilenivanov.blogspot.com/feeds/243478163996777031/comments/default', u'http://tagschema.com/blogs/tagschema/atom.xml', u'http://techcrunch.posterous.com/rss.xml', u'http://thebigcaption.com/rss', u'http://timurcommandos.blogspot.com/feeds/posts/default?alt=rss', u'http://tochitsa1.blogspot.com/feeds/posts/default?alt=rss', u'http://totalmoral.blogspot.com/feeds/posts/default', u'http://tuk-tame.blogspot.com/feeds/posts/default?alt=rss', u'http://uncrunched.com/feed/', u'http://valery.bgit.net/blog-bg/feed/', u'http://vitelcom.blogspot.com/feeds/posts/default', u'http://wesandersonpalettes.tumblr.com/rss', u'http://whatsthatcrap.blogspot.com/feeds/posts/default?alt=rss', u'http://ws.audioscrobbler.com/1.0/artist/Norah Jones/events.rss', u'http://www.ajaxian.com/index.rdf', u'http://www.all4android.com/feed/', u'http://www.allthingsdistributed.com/index.xml', u'http://www.authenticjobs.com/rss/custom.php?terms=&type=2&cats=&onlyremote=&location=', u'http://www.authenticjobs.com/rss/custom.php?terms=Anywhere&type=1,2,3,4&cats=&onlyremote=&location=', u'http://www.avramov.com/blog/?feed=rss2', u'http://www.awaretek.com/python/index.xml', u'http://www.babble.com/Global/Rss/Feeds/toddler.xml', u'http://www.bgkite.com/feed/', u'http://www.boston.com/bigpicture/bpnotes/index.xml', u'http://www.bothsidesofthetable.com/feed/', u'http://www.businessesforsale.com/search/Businesses-for-sale-in-Plovdiv.rss?keywords=Plovdiv', u'http://www.buzzlogic.com/blog/atom.xml', u'http://www.c5bench.com/feed/', u'http://www.capital.bg/rss.php?blog=1', u'http://www.crashplan.com/blog/feed', u'http://www.dailydropcap.com/feed/rss', u'http://www.decocentric.com/feed/', u'http://www.desnite.eu/index.php?format=feed&type=rss', u'http://www.dnevnik.bg/rss/?rubrid=2546', u'http://www.dnevnik.bg/rss/search/?stext=%D0%B4%D0%B8%D0%BC%D0\u20265D1%81%D0%B5%D0%BD%D0%B5&backurl=&selfurl=&kfor_name=ssearch', u'http://www.dwellstudio.com/blog/rss', u'http://www.eventsplovdiv.info/export/rss', u'http://www.firebirdnews.org/?feed=atom', u'http://www.fmd.bg/?feed=rss2', u'http://www.fmi-plovdiv.org/rss.jsp', u'http://www.gapingvoid.com/atom.xml', u'http://www.hollywoodreporter.com/taxonomy/term/7973/all/feed', u'http://www.hotel-orbita.com/feed/', u'http://www.informationisbeautiful.net/feed/', u'http://www.ivantotev.com/novini/site-feed/RSS', u'http://www.joelonsoftware.com/rss.xml', u'http://www.kitesurf-varna.com/blog/?feed=rss2', u'http://www.kldn.net/?feed=rss2', u'http://www.lstudio.com/rss/lstudiorss.xml', u'http://www.matsays.com/feed/', u'http://www.mobilehtml5.com/rss', u'http://www.nadgraphics.com/feed/', u'http://www.niallkennedy.com/blog/index.atom', u'http://www.pannonrex.com/blog/?feed=rss2', u'http://www.phonegap.com/feed/', u'http://www.phpied.com/feed/', u'http://www.pythonware.com/daily/rss.xml', u'http://www.quirksmode.org/blog/atom.xml', u'http://www.reddit.com/r/AppEngine/.rss', u'http://www.reddit.com/r/AppEngine/comments/f4tpf/what_are_the_best_app_engine_packagesprojects/.rss', u'http://www.reddit.com/r/firebird/.rss', u'http://www.reduta.bg/?feed=rss2', u'http://www.robertnyman.com/feed/', u'http://www.sarajchipps.com/rss.xml', u'http://www.scripting.com/rss.xml', u'http://www.shotton.com/wp/feed/', u'http://www.snook.ca/jonathan/index.rdf', u'http://www.stevesouders.com/blog/feed/', u'http://www.techmeme.com/search/rssquery?q=Twingly&wm=false', u'http://www.techmeme.com/search/rssquery?q=techmeme&wm=false', u'http://www.thecoolhunter.net/index2.php?option=com_rss&feed=RSS2.0&no_html=1', u'http://www.thegrifters.org/feed/', u'http://www.trikorni.com/feed/', u'http://www.watchingwebsites.com/feed', u'http://www.wordyard.com/category/code-reads/feed/', u'http://www.wotzwot.com/rssxl.php?pageurl=http://www.samflemming.com/&sf=<\u2026n .post -->&ei= &sd=&ed=&linkno=1&vcode=770459162', u'http://xooglers.blogspot.com/atom.xml', u'http://yovko.net/feed', u'http://zooie.wordpress.com/feed/', u'https://amazonsilk.wordpress.com/feed/', u'https://antiideas.wordpress.com/feed/', u'https://bg.wordpress.org/feed/', u'https://bgmindstorms.wordpress.com/feed/', u'https://blog.mozilla.org/ux/feed/', u'https://blogs.msdn.com/b/b8/rss.aspx', u'https://christogrozev.wordpress.com/feed/', u'https://gun.io/feed/', u'https://hacks.mozilla.org/feed/', u'https://nikcub.appspot.com/feed', u'https://sugarfreenora.wordpress.com/feed/', u'https://voreshkov.posterous.com/rss.xml', u'https://www.facebook.com/feeds/page.php?format=rss20&id=197266283722139']
        return feeds if allFeeds else feeds[datetime.now().minute / 3::20] ## every 20th feed

    def get6thFeedEveryTenMinutes(self, allFeeds):

        feeds = [u'http://174.129.28.157/feed/', u'http://33bits.org/feed/', u'http://appengine-cookbook.appspot.com/feeds', u'http://artsbeat.blogs.nytimes.com/tag/mad-men-watch/feed/', u'http://aspn.activestate.com/ASPN/Cookbook/Python/index_rss', u'http://awesomepeoplehangingouttogether.tumblr.com/rss', u'http://beta.dailycolorscheme.com/feed/rss', u'http://bg-bg.facebook.com/feeds/page.php?id=184792058258487&format=atom10', u'http://bijansabet.com/rss', u'http://blog.codeclub.org.uk/blog/feed/', u'http://blog.distimo.com/category/android-market/feed/', u'http://blog.floxee.com/rss', u'http://blog.how-to-web.net/feed/', u'http://blog.ianbicking.org/feed/atom/', u'http://blog.kickstarter.com/rss/', u'http://blog.makezine.com/archive/make_store/index.xml', u'http://blog.musiclessons.bg/?feed=rss2', u'http://blog.notdot.net/feeds/atom.xml', u'http://blog.notifo.com/rss.xml', u'http://blog.peio.org/?feed=rss2', u'http://blog.rightscale.com/feed/', u'http://blog.thenounproject.com/rss', u'http://blogs.msdn.com/dthorpe/rss.xml', u'http://blogs.msdn.com/rssteam/rss.xml', u'http://blorn.com/rss', u'http://boyscoutmag.com/feed/', u'http://bunnylava.blogspot.com/feeds/posts/default', u'http://burakkanber.com/blog/feed/', u'http://calendar.perfplanet.com/feed/', u'http://capital-risqueur.blogspot.com/feeds/posts/default', u'http://cdixon.org/?feed=rss2', u'http://code.google.com/feeds/p/asynctools/issueupdates/basic', u'http://code.google.com/feeds/p/django-firebird/issueupdates/basic', u'http://corporateyouth.org/?feed=rss', u'http://coupland.blogs.nytimes.com/atom.xml', u'http://cracking-the-code.blogspot.com/feeds/posts/default', u'http://cvyk.blogspot.com/atom.xml', u'http://dekstop.de/weblog/index.xml', u'http://denitsa33.blogspot.com/feeds/posts/default?alt=rss', u'http://detskiknigi.com/feed/', u'http://dima.kalifish.com/?feed=rss2', u'http://dni.li/feed/', u'http://dunelmtechnology.co.uk/feed/', u'http://dzver.com/blog/?feed=rss2', u'http://edenflamingo.com/feed/', u'http://emurry.com/blog/feed/', u'http://essme.blogspot.com/feeds/posts/default?alt=rss', u'http://feedproxy.google.com/eenk', u'http://feedproxy.google.com/nettuts', u'http://feeds.dantup.com/DanTup', u'http://feeds.feedburner.com/AppEngineFan', u'http://feeds.feedburner.com/BonjourMadame', u'http://feeds.feedburner.com/BuzzMachine', u'http://feeds.feedburner.com/CityKidsbg', u'http://feeds.feedburner.com/DataMining', u'http://feeds.feedburner.com/Designknigoizdavane', u'http://feeds.feedburner.com/GeorgiNedelchevMonitoring', u'http://feeds.feedburner.com/GoogleAppEngineBlog', u'http://feeds.feedburner.com/InformationIsBeautiful', u'http://feeds.feedburner.com/Inkzee', u'http://feeds.feedburner.com/JeremiahGrossman', u'http://feeds.feedburner.com/JoshuaSchachter', u'http://feeds.feedburner.com/ModernLifeIsRubbish', u'http://feeds.feedburner.com/ServiceLevelAutomation', u'http://feeds.feedburner.com/SinticaEN', u'http://feeds.feedburner.com/Startup2Startup', u'http://feeds.feedburner.com/TheGrifters', u'http://feeds.feedburner.com/TheItRoom', u'http://feeds.feedburner.com/TheStartupFoundry', u'http://feeds.feedburner.com/TheUniversalGadget', u'http://feeds.feedburner.com/WSwI', u'http://feeds.feedburner.com/WhatAssociationBlog', u'http://feeds.feedburner.com/WhitehatSecurityBlog', u'http://feeds.feedburner.com/WorkHappy', u'http://feeds.feedburner.com/YlasticBlog', u'http://feeds.feedburner.com/alexanderkirk', u'http://feeds.feedburner.com/blogspot/OGBVh', u'http://feeds.feedburner.com/brettaylor', u'http://feeds.feedburner.com/carpeaqua', u'http://feeds.feedburner.com/catonmat', u'http://feeds.feedburner.com/crunchnotes', u'http://feeds.feedburner.com/directededge', u'http://feeds.feedburner.com/errorceptionBlog', u'http://feeds.feedburner.com/fastcompany/scobleizer', u'http://feeds.feedburner.com/garrettdimoncom', u'http://feeds.feedburner.com/georgiangelov', u'http://feeds.feedburner.com/iwdrm?format=xml', u'http://feeds.feedburner.com/john-nousis', u'http://feeds.feedburner.com/littlebigdetails', u'http://feeds.feedburner.com/mcsweeneys', u'http://feeds.feedburner.com/re-winder/feed', u'http://feeds.feedburner.com/reklama', u'http://feeds.feedburner.com/relevance-llc', u'http://feeds.feedburner.com/startupcompanylawyer', u'http://feeds.feedburner.com/startupping', u'http://feeds.feedburner.com/takaitaka2', u'http://feeds.feedburner.com/thesassway', u'http://feeds.feedburner.com/trendsspotting-feeds', u'http://feeds.feedburner.com/ubervu', u'http://feeds.feedburner.com/united-coders', u'http://feeds.infosthetics.com/infosthetics', u'http://feeds.simonwillison.net/swn-entries', u'http://feeds.sparkabout.net/sparkabout', u'http://feeds.venturehacks.com/venturehacks', u'http://feeds2.feedburner.com/LouisgraycomLive', u'http://feeds2.feedburner.com/Luckyrobotcom-GerryCampbell', u'http://feeds2.feedburner.com/StartupsInTurkey', u'http://feeds2.feedburner.com/asert/', u'http://feeds2.feedburner.com/bradburnham', u'http://feeds2.feedburner.com/openfund', u'http://feeds2.feedburner.com/startup/lessons/learned', u'http://fitsnstarts.tumblr.com/rss', u'http://friendfeed.com/gaberivera?format=atom', u'http://fusible.com/feed/', u'http://fxshaw.wordpress.com/feed/', u'http://gamedev.stackexchange.com/feeds/tag/html5', u'http://glasshouse.waggeneredstrom.com/blogs/frankshaw/rss.aspx', u'http://gloriapetkova.blogspot.com/feeds/posts/default?alt=rss', u'http://gradinadetelina.blogspot.com/feeds/posts/default?alt=rss', u'http://grigorweblog.wordpress.com/feed/', u'http://groups.google.com/group/get-theinfo/feed/rss_v2_0_msgs.xml', u'http://groups.google.com/group/google-appengine-downtime-notify/feed/rss_v2_0_msgs.xml', u'http://headrush.typepad.com/creating_passionate_users/index.rdf', u'http://ibdeveloper.blogspot.com/feeds/posts/default', u'http://ikonomika.org/?feed=rss2', u'http://ivanbedrov.com/?feed=rss2', u'http://jobs.37signals.com/categories/2/jobs.rss', u'http://joehewitt.com/index.xml', u'http://k1tesurf.com/main/component/option,com_rss/feed,RSS2.0/no_html,1/lang,en/', u'http://kanyewesanderson.tumblr.com/rss', u'http://krisibeta.tumblr.com/rss', u'http://krokotak.com/feed/', u'http://launchub.com/blog/?feed=rss2', u'http://levosgien.net/feed/', u'http://lifehacker.com/tag/android/index.xml', u'http://littlebits.cc/feed', u'http://ljato.wordpress.com/feed/', u'http://loveandtheft.org/feed/', u'http://lundxy.com/?feed=rss2', u'http://lydblog.wordpress.com/feed/', u'http://metaoptimize.com/blog/feed/', u'http://mhlegal.eu/bgblog/feed/', u'http://mightbwrong.tumblr.com/rss', u'http://milenafuchedjieva.blogspot.com/feeds/posts/default', u'http://mymilktoof.blogspot.com/feeds/posts/default', u'http://nellyo.wordpress.com/feed/', u'http://news.netcraft.com/feed/', u'http://nslatinski.org/?q=bg/rss.xml', u'http://odeqlo.wordpress.com/feed/', u'http://okdork.com/feed/rss', u'http://omis.me/feed/', u'http://open.blogs.nytimes.com/atom.xml', u'http://particletree.com/rss/', u'http://pavel-yanchev.blogspot.com/feeds/posts/default', u'http://pavlinav.wordpress.com/feed/', u'http://plovediv.com/feed', u'http://pomstar.org/rss', u'http://python-history.blogspot.com/feeds/posts/default?alt=rss', u'http://radankanev.blogspot.com/feeds/posts/default?alt=rss', u'http://reyk.tumblr.com/rss', u'http://rss.babble.com/babblenewthisweek/', u'http://rss.groups.yahoo.com/group/firebird-python/rss', u'http://rss.searchyc.com/techmeme?sort=by_date', u'http://scobleizer.posterous.com/rss.xml', u'http://search.twitter.com/search.atom?q=ececars', u'http://search.twitter.com/search.atom?q=smonev', u'http://seoblackhat.com/feed', u'http://shop.studioreforma.com/?feed=rss2', u'http://showmedo.com/latestVideoFeed/rss2.0?tag=python', u'http://simeons.wordpress.com/feed/', u'http://simoivanov.com/feed', u'http://songibson.wordpress.com/feed/', u'http://soroush.secproject.com/blog/feed/', u'http://sredparcalkitevshkafa.blogspot.com/feeds/posts/default?alt=rss', u'http://stackoverflow.com/feeds/tag?tagnames=translate3d&sort=newest', u'http://stallman.org/rss/rss.xml', u'http://status.blogrolling.com/rss', u'http://svilenivanov.blogspot.com/feeds/243478163996777031/comments/default', u'http://tagschema.com/blogs/tagschema/atom.xml', u'http://techcrunch.posterous.com/rss.xml', u'http://thebigcaption.com/rss', u'http://timurcommandos.blogspot.com/feeds/posts/default?alt=rss', u'http://tochitsa1.blogspot.com/feeds/posts/default?alt=rss', u'http://totalmoral.blogspot.com/feeds/posts/default', u'http://tuk-tame.blogspot.com/feeds/posts/default?alt=rss', u'http://uncrunched.com/feed/', u'http://valery.bgit.net/blog-bg/feed/', u'http://vitelcom.blogspot.com/feeds/posts/default', u'http://wesandersonpalettes.tumblr.com/rss', u'http://whatsthatcrap.blogspot.com/feeds/posts/default?alt=rss', u'http://ws.audioscrobbler.com/1.0/artist/Norah Jones/events.rss', u'http://www.ajaxian.com/index.rdf', u'http://www.all4android.com/feed/', u'http://www.allthingsdistributed.com/index.xml', u'http://www.authenticjobs.com/rss/custom.php?terms=&type=2&cats=&onlyremote=&location=', u'http://www.authenticjobs.com/rss/custom.php?terms=Anywhere&type=1,2,3,4&cats=&onlyremote=&location=', u'http://www.avramov.com/blog/?feed=rss2', u'http://www.awaretek.com/python/index.xml', u'http://www.babble.com/Global/Rss/Feeds/toddler.xml', u'http://www.bgkite.com/feed/', u'http://www.boston.com/bigpicture/bpnotes/index.xml', u'http://www.bothsidesofthetable.com/feed/', u'http://www.businessesforsale.com/search/Businesses-for-sale-in-Plovdiv.rss?keywords=Plovdiv', u'http://www.buzzlogic.com/blog/atom.xml', u'http://www.c5bench.com/feed/', u'http://www.capital.bg/rss.php?blog=1', u'http://www.crashplan.com/blog/feed', u'http://www.dailydropcap.com/feed/rss', u'http://www.decocentric.com/feed/', u'http://www.desnite.eu/index.php?format=feed&type=rss', u'http://www.dnevnik.bg/rss/?rubrid=2546', u'http://www.dnevnik.bg/rss/search/?stext=%D0%B4%D0%B8%D0%BC%D0\u20265D1%81%D0%B5%D0%BD%D0%B5&backurl=&selfurl=&kfor_name=ssearch', u'http://www.dwellstudio.com/blog/rss', u'http://www.eventsplovdiv.info/export/rss', u'http://www.firebirdnews.org/?feed=atom', u'http://www.fmd.bg/?feed=rss2', u'http://www.fmi-plovdiv.org/rss.jsp', u'http://www.gapingvoid.com/atom.xml', u'http://www.hollywoodreporter.com/taxonomy/term/7973/all/feed', u'http://www.hotel-orbita.com/feed/', u'http://www.informationisbeautiful.net/feed/', u'http://www.ivantotev.com/novini/site-feed/RSS', u'http://www.joelonsoftware.com/rss.xml', u'http://www.kitesurf-varna.com/blog/?feed=rss2', u'http://www.kldn.net/?feed=rss2', u'http://www.lstudio.com/rss/lstudiorss.xml', u'http://www.matsays.com/feed/', u'http://www.mobilehtml5.com/rss', u'http://www.nadgraphics.com/feed/', u'http://www.niallkennedy.com/blog/index.atom', u'http://www.pannonrex.com/blog/?feed=rss2', u'http://www.phonegap.com/feed/', u'http://www.phpied.com/feed/', u'http://www.pythonware.com/daily/rss.xml', u'http://www.quirksmode.org/blog/atom.xml', u'http://www.reddit.com/r/AppEngine/.rss', u'http://www.reddit.com/r/AppEngine/comments/f4tpf/what_are_the_best_app_engine_packagesprojects/.rss', u'http://www.reddit.com/r/firebird/.rss', u'http://www.reduta.bg/?feed=rss2', u'http://www.robertnyman.com/feed/', u'http://www.sarajchipps.com/rss.xml', u'http://www.scripting.com/rss.xml', u'http://www.shotton.com/wp/feed/', u'http://www.snook.ca/jonathan/index.rdf', u'http://www.stevesouders.com/blog/feed/', u'http://www.techmeme.com/search/rssquery?q=Twingly&wm=false', u'http://www.techmeme.com/search/rssquery?q=techmeme&wm=false', u'http://www.thecoolhunter.net/index2.php?option=com_rss&feed=RSS2.0&no_html=1', u'http://www.thegrifters.org/feed/', u'http://www.trikorni.com/feed/', u'http://www.watchingwebsites.com/feed', u'http://www.wordyard.com/category/code-reads/feed/', u'http://www.wotzwot.com/rssxl.php?pageurl=http://www.samflemming.com/&sf=<\u2026n .post -->&ei= &sd=&ed=&linkno=1&vcode=770459162', u'http://xooglers.blogspot.com/atom.xml', u'http://yovko.net/feed', u'http://zooie.wordpress.com/feed/', u'https://amazonsilk.wordpress.com/feed/', u'https://antiideas.wordpress.com/feed/', u'https://bg.wordpress.org/feed/', u'https://bgmindstorms.wordpress.com/feed/', u'https://blog.mozilla.org/ux/feed/', u'https://blogs.msdn.com/b/b8/rss.aspx', u'https://christogrozev.wordpress.com/feed/', u'https://gun.io/feed/', u'https://hacks.mozilla.org/feed/', u'https://nikcub.appspot.com/feed', u'https://sugarfreenora.wordpress.com/feed/', u'https://voreshkov.posterous.com/rss.xml', u'https://www.facebook.com/feeds/page.php?format=rss20&id=197266283722139']
        return feeds if allFeeds else feeds[datetime.now().minute / 10::6] ## every 6th feed

        ##return ['http://feeds.feedburner.com/typepad/alleyinsider/silicon_alley_insider', u'http://www.engadget.com/rss.xml', u'http://feeds.paidcontent.org/pcorg']
        i = -1
        d = datetime.now()
        minute = d.minute / 10 ## process every 6th blog every 10 minutes = 1h for all
        blogToProcess = []

        # cacheKey = 'feed_data_settings___all'
        # feeds = None 
        # feeds = memcache.get(cacheKey)
        # if (feeds is None):
        #     feeds = FeedDataSettings.query()
        #     memcache.set(cacheKey, feeds, 1800) ## 1h

        # for f in feeds:
        #     i = i + 1
        #     if (i == minute) or (allFeeds):
        #         i = -1
        #         blogToProcess.append(f)

        blogToProcess = feeds[0::100]

        self.response.out.write(blogToProcess)
        return blogToProcess

    def get(self):
        self.response.out.write('-1')
        from google.appengine.api import urlfetch

        self.response.out.write('0')
        urls = self.getUrls(self.request.get('allFeeds') == '1')
        self.response.out.write('1')

        rpcs = []
        resultUrls = []
        self.response.out.write('2')
        
        for url in urls:
            try:
                url = urllib.quote_plus(url)
                url = 'http://' + self.request.host + '/cronfeed/' + url
                ##rpc = urlfetch.create_rpc(deadline=15.0) 
                rpc = urlfetch.create_rpc(deadline=15.0) 
                urlfetch.make_fetch_call(rpc, url)
                rpcs.append(rpc)
                resultUrls.append(url)
            except:
                logging.debug('url error in cronfeed, skipping url: %s', url)

            self.response.out.write('<br>' + url)

        for rpc in rpcs:
            rpc.wait()

        # ##allFeeds = self.request.get('allFeeds')
        # ##urls = self.get6thFeedEveryTenMinutes(allFeeds == '1')
        # urls = self.get6thFeedEveryTenMinutes(False)
        # self.response.out.write(urls)

        # for url in urls:
        #     taskqueue.add(queue_name='cronFeeds', url='/cronfeed/' + urllib.quote_plus(url))

        # logging.debug('tasks added')

        ##urls = self.get6thFeedEveryTenMinutes(self.request.get('allFeeds') == '1')

        ##rpcs = []
        ##resultUrls = []
        
            # for url in urls:
            #     url = urllib.quote_plus(url)
            #     url = 'http://' + self.request.host + '/cronfeed/' + url
            #     rpc = urlfetch.create_rpc() ##deadline=1.0s
            #     urlfetch.make_fetch_call(rpc, url)
            #     rpcs.append(rpc)
            #     resultUrls.append(url)

            #     ##self.response.out.write('<br>' + url)

            # for rpc in rpcs:
            #     rpc.wait()

class CronFeedHandler(BasicHandler):

    def get(self, feed):
        self.GetAndParse(feed, self.request.get('debug') == '1')
        self.response.out.write('ok')

class FeedHandler(BasicHandler):

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

    # def fetchFeed(self, feedUrl):
    #     from google.appengine.api import urlfetch

    #     rpcs = []
    #     try:
    #         url = urllib.quote_plus(feedUrl)
    #         url = 'http://' + self.request.host + '/cronfeed/' + url
    #         rpc = urlfetch.create_rpc(deadline=30.0) 
    #         urlfetch.make_fetch_call(rpc, url)
    #         rpcs.append(rpc)
    #     except:
    #         logging.debug('url error in fetchFeed, url: %s', url)


    #     for rpc in rpcs:
    #         rpc.wait()


    # def fetchFeed(self, feedUrl):
    #     cronUrl = 'http://' + self.request.host + '/cronfeed/' + urllib.quote_plus(feedUrl)
    #     logging.debug('crooooooooooooooonurl: %s', cronUrl)
    #     result = urllib.urlopen(cronUrl)

    def addNewFeed(self, feedUrl):
        logging.debug('adding feed: %s', feedUrl)
        fds = FeedDataSettings.get_by_id(feedUrl)
        
        if fds is None:
            fds = FeedDataSettings(url=feedUrl, id=feedUrl, article_count=0, feedDataCount=0, private_data='', new_etag='', new_modified='', refCount=1)
        else:
            fds.refCount = fds.refCount + 1

        # self.fetchFeed(feedUrl)
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

    def post(self):
        from google.appengine.api import users

        user = users.get_current_user()
        if user:
            ud = self.GetAppUserByEmail(user.email())
            if ud != None:
                data = self.request.get('data')

                newFeed = self.request.get('newFeed')
                if newFeed:
                    self.addNewFeed(newFeed)

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

class UploadOPMLHandler(blobstore_handlers.BlobstoreUploadHandler):
    ##jsonBlogList = '{"username":"' + username + '", "bloglist":{"1":[{"url":"3","title":"3"},{"url":"4","title":"4"}],"2":[{"url":"http://www.engadget.com/rss.xml","title":"Engadget RSS Feed"},{"url":"http://feeds.gawker.com/gizmodo/full","title":"Gizmodo"},{"url":"http://feeds.feedburner.com/TheBoyGeniusReport","title":"BGR"}]}}'
    ##jsonBlogList = '{"username":"' + username + '", "bloglist":{ ## }'

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

    ('/GetUserFeeds',GetUserFeedsHandler),
    ('/SaveSettings',SaveSettingsHandler),
    ('/MarkArticlesAsRead',MarkArticlesAsRead),
    ('/StarArticle',StarArticle),

    ('/cronfeeds', CronFeedsHandler),
    ('/cronfeed/(.*)', CronFeedHandler),
    ('/feed/(.*)', FeedHandler),
    
    ('/uploadOPML', UploadOPMLHandler),
    ('/redirect', RedirectHandler),

    ('/', MainHandler)
]

app = webapp2.WSGIApplication(ROUTES, debug=DEBUG)
