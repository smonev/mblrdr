from google.appengine.ext import ndb

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
