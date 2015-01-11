var AppStore = require('./AppStore.js');
var PubSub = require('pubsub-js');

(function() {
    //raf polyfill
    "use strict";if(!Date.now)Date.now=function(){return(new Date).getTime()};(function(){var n=["webkit","moz"];for(var e=0;e<n.length&&!window.requestAnimationFrame;++e){var i=n[e];window.requestAnimationFrame=window[i+"RequestAnimationFrame"];window.cancelAnimationFrame=window[i+"CancelAnimationFrame"]||window[i+"CancelRequestAnimationFrame"]}if(/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)||!window.requestAnimationFrame||!window.cancelAnimationFrame){var a=0;window.requestAnimationFrame=function(n){var e=Date.now();var i=Math.max(a+16,e);return setTimeout(function(){n(a=i)},i-e)};window.cancelAnimationFrame=clearTimeout}})();
})();

/* appear.min.js 0.0.14 */
appear = function() {
    "use strict";
    function e() {
        var e = window.scrollY || window.pageYOffset;null != n && (o.velocity = e - n, o.delta = o.velocity >= 0 ? o.velocity : -1 * o.velocity), n = e, i && clearTimeout(i), i = setTimeout(function() {
            n = null
        }, 30)
    }
    function t(e, t) {
        var n = e.getBoundingClientRect();return n.top + n.height >= 0 && n.left + n.width >= 0 && n.bottom - n.height <= (window.innerHeight || document.documentElement.clientHeight) + t && n.right - n.width <= (window.innerWidth || document.documentElement.clientWidth) + t
    }
    var n = null,
        i = 0,
        o = {};
    return addEventListener("scroll", e), function(e) {
            return function() {
                function e(e, t) {
                    return function() {
                        var n = this,
                            i = arguments;
                        clearTimeout(c), c = setTimeout(function() {
                            e.apply(n, i)
                        }, t)
                    }
                }
                function n() {
                    o.delta < w.delta.speed && (l || (l = !0, u(), setTimeout(function() {
                        l = !1
                    }, w.delta.timeout))), e(function() {
                        u()
                    }, w.debounce)()
                }
                function i() {
                    u(), addEventListener("scroll", n), addEventListener("resize", n)
                }
                function r() {
                    m = [], c && clearTimeout(c), a()
                }
                function a() {
                    removeEventListener("scroll", n), removeEventListener("resize", n)
                }
                function u() {
                    s || (m.forEach(function(e, n) {
                        e && t(e, w.bounds) ? v[n] && (v[n] = !1, h++, w.appear && w.appear(e), w.disappear || w.reappear || (m[n] = null)) : (v[n] === !1 && (w.disappear && w.disappear(e), g++, w.reappear || (m[n] = null)), v[n] = !0)
                    }), w.reappear || w.appear && (!w.appear || h !== p) || w.disappear && (!w.disappear || g !== p) || (s = !0, a(), w.done && w.done()))
                }
                function d() {
                    if (!f) {
                        f = !0, w.init && w.init();
                        var e;
                        if (e = "function" == typeof w.elements ? w.elements() : w.elements) {
                            p = e.length;
                            for (var t = 0; p > t; t += 1) {
                                m.push(e[t]), v.push(!0);
                            }
                            i()
                        }
                    }
                }
                var p, c, l, s,
                    f = !1,
                    m = [],
                    v = [],
                    h = 0,
                    g = 0,
                    w = {};
                return function(e) {
                    return e = e || {}, w = {
                            init: e.init,
                            elements: e.elements,
                            appear: e.appear,
                            disappear: e.disappear,
                            done: e.done,
                            reappear: e.reappear,
                            bounds: e.bounds || 0,
                            debounce: e.debounce || 50,
                            delta: {
                                speed: e.deltaSpeed || 50,
                                timeout: e.deltaTimeout || 500
                            }
                        }, addEventListener("DOMContentLoaded", d), "complete" === document.readyState && d(), {
                            trigger: function() {
                                u()
                            },
                            pause: function() {
                                a()
                            },
                            resume: function() {
                                i()
                            },
                            destroy: function() {
                                r()
                            }
                    }
                }
            }()(e)
    }
}();

var AppUtils = {

    scrollTo: function(scrollPos, interval) {
        $('html, body').animate({
            scrollTop: scrollPos
        }, interval);
    },

    markArticleAsRead: function(data) {
        var markReadData = {}, decodedUrl = decodeURIComponent(data.url);
        markReadData[decodedUrl] = [data.id];

        $.post("/MarkArticlesAsRead?read=1&allRead=-1", {
            'data': JSON.stringify(markReadData)
        }, function(data, status, xhr) {
            if (status !== "success") {
                AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].readCount - 1;
            }
        });
        if (AppStore.readData[decodedUrl]) {
            AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].readCount + 1;
        } else {
            AppStore.readData[decodedUrl].readCount = 1;
        }

        this.calcFolderUnreadCount(data.folder);
        PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
    },

    starArticle: function(data) {
        $.post("/StarArticle", {
            'data': JSON.stringify(data)
        }, function(data, status, xhr) {
            //PubSub.publish('STAR_ARTICLE', JSON.parse(data));
        });
    },

    markFeedAsRead: function(folder, url) {
        var markReadData = {}, decodedUrl = decodeURIComponent(url);
        markReadData[decodedUrl] = [];

        $.post("/MarkArticlesAsRead?read=1&allRead=1", {
            'data': JSON.stringify(markReadData)
        }, function(data, status, xhr) {
            PubSub.publish('MARK_READ_FEED', JSON.parse(data).feedUrl);
        });

        if (AppStore.readData[decodedUrl]) {
            AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].totalCount;
        }

        this.calcFolderUnreadCount(folder);
        PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
    },

    markFolderAsRead: function(folder) {
        var feeds = AppStore.userData.bloglist[folder];;
        feeds.map(function (feed) {
            this.markFeedAsRead(folder, feed.url);
        }.bind(this));
        this.calcFolderUnreadCount(folder);
        PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
    },

    markAllFoldersAsRead: function() {
        Object.keys(AppStore.userData.bloglist).forEach(function(folder) {
          this.markFolderAsRead(folder);
        }.bind(this));
    },

    deleteFolder: function(folder) {
        delete AppStore.userData.bloglist[folder];
        this.saveSettings(function() {
            PubSub.publish('DELETE_FOLDER', folder);
            alert('Folder ' + folder + ' is deleted.');
        });
    },

    unsubscribeFeed: function(folder, feed) {
        var decodedFeed = decodeURIComponent(feed);
        for (i = 0; i < AppStore.userData.bloglist[folder].length; i++) {
            if (AppStore.userData.bloglist[folder][i].url === decodedFeed) {
                AppStore.userData.bloglist[folder].splice(i, 1);
                this.saveSettingsWithDelete(decodedFeed, function() {
                    alert('You are now unsubscibed from ' + decodedFeed);
                });
                break;
            }
        }
    },

    updateFeedTitleIfNeeded: function(folder, feed, title) {
        var decodedFeed = decodeURIComponent(feed);
        for (i = 0; i < AppStore.userData.bloglist[folder].length; i++) {
            if (AppStore.userData.bloglist[folder][i].url === decodedFeed) {
                if (AppStore.userData.bloglist[folder][i].title !== title) {
                    AppStore.userData.bloglist[folder][i].title = title;
                    this.saveSettings();
                }
                break;
            }
        }
    },

    getFeedData: function (feedUrl, successCallback) {
        $.get("/feed/" + feedUrl, function(result) {
            successCallback.apply(this, [result]);
        });
    },

    addNewFeed: function(folder, feed) {

        AppStore.userData.bloglist[folder].push({
            'url': feed,
            'title': feed
        });

        this.saveSettings(function() {
            PubSub.publish('NEW_FEED_ADDED', {
                'folder': folder,
                'feed': feed
            });
        });
    },

    addNewFolder: function(folder) {
        if (typeof AppStore.userData.bloglist[folder] === "undefined") {
            AppStore.userData.bloglist[folder] = [];
            this.saveSettings(function() {
                PubSub.publish('NEW_FOLDER_ADDED', folder);
            });
        }
    },

    saveSettings: function (successCallback) {
        var data = {
            "bloglist": AppStore.userData.bloglist,
            "username": AppStore.userData.username,
            "userSettings": AppStore.userData.userSettings
        };

        $.post("/SaveSettings", {
            'data': JSON.stringify(data)
        }, function () {
            if (typeof successCallback === "function") {
                successCallback.call();
            }
        });
    },

    saveSettingsWithDelete: function(deleteFeed, successCallback) {
        var data = {
            "bloglist": AppStore.userData.bloglist,
            "username": AppStore.userData.username,
            "userSettings": AppStore.userData.userSettings
        };

        $.post("/SaveSettings?deleteFeed=" + deleteFeed, {
            'data': JSON.stringify(data)
        }, function(data) {
            if (typeof successCallback === "function") {
                successCallback.call();
            }
        });
    },

    getUserFeeds: function(url, successCallback) {
        $.get(url, function(result) {
            AppStore.userData = result;
            successCallback.apply(this, [result]);
        });
    },

    calcFoldersUnreadCount: function() {
        AppStore.foldersUnreadCount = {};

        for (folder in AppStore.userData.bloglist) {
            this.calcFolderUnreadCount(folder);
        }
    },

    calcFolderUnreadCount: function(folder) {
        var folderUnreadCount = 0;

        //get all folder feeds
        for (var i=0; i < AppStore.userData.bloglist[folder].length; i++) {
            feedUrl = AppStore.userData.bloglist[folder][i].url;
            if (typeof AppStore.readData[feedUrl] !== "undefined") {
                if (AppStore.readData[feedUrl].totalCount - AppStore.readData[feedUrl].readCount > 0) {
                    folderUnreadCount = folderUnreadCount + AppStore.readData[feedUrl].totalCount - AppStore.readData[feedUrl].readCount
                }
            }
        }

        AppStore.foldersUnreadCount[folder] = folderUnreadCount;

    },

    changeFeedFolder: function(fromFolder, toFolder, url) {
        var decodedUrl = decodeURIComponent(url)

        //find and remove it
        $.each(AppStore.userData.bloglist[fromFolder], function(i, feed) {
            if (feed.url === decodedUrl) {
                AppStore.userData.bloglist[fromFolder].splice(i, 1);
                AppStore.userData.bloglist[toFolder].push(feed);
                return false;
            }
        });

        this.saveSettings(function() {
            PubSub.publish('FEED_FOLDER_CHANGED', {
                'toFolder': toFolder,
                'feed': url
            });
        });

        this.calcFolderUnreadCount(fromFolder);
        this.calcFolderUnreadCount(toFolder);
    },

    getReadData: function(url, initialFolder ) {
        $.get(url, function(data) {
            AppStore.readData = data;
            this.calcFoldersUnreadCount();
            PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
            PubSub.publish('FEED_READ_COUNT_CHANGED', {
                folder: initialFolder
            });
        }.bind(this));
    },

    generateUploadUrlHandler: function(successCallback) {
        $.get("/GenerateUploadUrl", function(data) {
            successCallback.apply(this, [data]);
        });
    }
};

module.exports = AppUtils;
