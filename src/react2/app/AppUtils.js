'use strict';

var AppStore = require('./AppStore.js');
var PubSub = require('pubsub-js');

var AppUtils = {

    scrollTo: function(scrollPos, interval) {

        //Velocity('scroll', { duration: 1500, easing: 'spring' })

        //Velocity('scroll', { offset: scrollPos, mobileHA: false, duration: 1500, easing: 'spring' });
        //Velocity(document.body, 'scroll', { duration: 250, offset: scrollPos, easing: 'spring' });
        Velocity(document.body, 'scroll', { duration: 250, offset: scrollPos, easing: 'easeOutQuad' });


        //$('html, body').animate({
        //    scrollTop: scrollPos
        //}, interval);
    },

    markArticleAsRead: function(data) {
        var markReadData = {}, decodedUrl = decodeURIComponent(data.url);
        markReadData[decodedUrl] = [data.id];

        $.post('/MarkArticlesAsRead?read=1&allRead=-1', {
            'data': JSON.stringify(markReadData)
        }, function(newdata, status, xhr) {
            if (status !== 'success') {
                AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].readCount - 1;
            }
        });

        if (AppStore.readData[decodedUrl]) {
            AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].readCount + 1;
        } else {
            AppStore.readData[decodedUrl] = {
                readCount: 1
            };
        }

        if (!AppStore.readData[decodedUrl].localReadData) {
            AppStore.readData[decodedUrl].localReadData = [];
        }

        AppStore.readData[decodedUrl].localReadData.push(data.id);

        this.calcFolderUnreadCount(decodeURIComponent(data.folder));
        PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
    },

    starArticle: function(data) {
        $.post('/StarArticle', {
            'data': JSON.stringify(data)
        }, function(newdata, status, xhr) {
            //PubSub.publish('STAR_ARTICLE', JSON.parse(data));
        });
    },

    markFeedAsRead: function(folder, url) {
        var markReadData = {}, decodedUrl = decodeURIComponent(url), decodedFolder = decodeURIComponent(folder);
        markReadData[decodedUrl] = [];

        $.post('/MarkArticlesAsRead?read=1&allRead=1', {
            'data': JSON.stringify(markReadData)
        }, function(data, status, xhr) {
            PubSub.publish('MARK_READ_FEED', JSON.parse(data).feedUrl);
        });

        if (AppStore.readData[decodedUrl]) {
            AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].totalCount;
        }
        AppStore.nextRequestFromServer[decodedUrl] = true;

        this.calcFolderUnreadCount(decodedFolder);
        PubSub.publish('FOLDERS_UNREAD_COUNT_CHANGED', {});
    },

    markFolderAsRead: function(folder) {
        var feeds = AppStore.userData.bloglist[folder];
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
        function successUnsubscribe() {
            alert('You are now unsubscibed from ' + decodedFeed);
        }

        var decodedFeed = decodeURIComponent(feed);
        var decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        for (var i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
            if (AppStore.userData.bloglist[decodedFolder][i].url === decodedFeed) {
                AppStore.userData.bloglist[decodedFolder].splice(i, 1);
                this.saveSettingsWithDelete(decodedFeed, successUnsubscribe);
                break;
            }
        }
    },

    updateFeedTitleIfNeeded: function(folder, feed, title) {
        var decodedFeed = decodeURIComponent(feed);
        var decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        if (typeof AppStore.userData.bloglist === 'undefined') {
            return;
        }

        for (var i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
            if (AppStore.userData.bloglist[decodedFolder][i].url === decodedFeed) {
                if (AppStore.userData.bloglist[decodedFolder][i].title !== title) {
                    AppStore.userData.bloglist[decodedFolder][i].title = title;
                    this.saveSettings();
                }
                break;
            }
        }
    },

    getFeedTitle: function( folder, feed ) {
        var decodedFeed = decodeURIComponent(feed);
        var decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        for (var i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
            if (AppStore.userData.bloglist[decodedFolder][i].url === decodedFeed) {
                return AppStore.userData.bloglist[decodedFolder][i].title;
            }
        }
    },

    getFeedData: function (feedUrl, successCallback) {
        var colorWheel = document.getElementById('colorWheel');
        var deg = 0;
        var inAnimation = false;
        var animationTimeoutID;
        var rafAnimationID;

        function animateLoader() {
            colorWheel = colorWheel || document.getElementById('colorWheel');
            animationTimeoutID = setTimeout(function() {
                rafAnimationID = requestAnimationFrame(animateLoader);
                deg = deg + 30;
                if (colorWheel) {
                    colorWheel.style.webkitTransform = 'rotate(' +  deg + 'deg)';
                    colorWheel.style.MozTransform = 'rotate(' +  deg + 'deg)';
                    colorWheel.style.msTransform = 'rotate(' +  deg + 'deg)';
                    colorWheel.style.Transform = 'rotate(' +  deg + 'deg)';
                }
            }, 1000 / 30);
        }

        function startAnimation() {
            $('#colorWheel').show();
            if (!inAnimation) {
                inAnimation = true;
                animateLoader();
            }
        }

        function endAnimation () {
            inAnimation = false;
            clearTimeout(animationTimeoutID);
            window.cancelAnimationFrame(rafAnimationID);
            $('#colorWheel').hide();
        }

        startAnimation();


        feedUrl = this.updateForCache(feedUrl);
        $.get('/feed/' + feedUrl, function(result) {
            endAnimation();
            successCallback.apply(this, [result]);
        });
    },

    updateForCache: function(feedUrl) {
        var decodedUrl = decodeURIComponent(feedUrl);

        if (AppStore.nextRequestFromServer[decodedUrl]) {
            AppStore.nextRequestFromServer[decodedUrl] = false;
            feedUrl = feedUrl + '&v=' + Math.random();
        } else {
            var d1 = new Date(); d1.setHours(0); d1.setMinutes(0); d1.setSeconds(0); d1.setMilliseconds(0);
            var d2 = new Date();
            var period =  ((d2 - d1) / 1000 / 60 ) % 60; //waaat :) // ok, get the minutes between two dates (not more than an hour). waat :)
            period =  Math.floor(period / 10);

            feedUrl = feedUrl + '&v=' +  d1.getTime() + '___' + period;
        }
        return feedUrl;
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
        if (typeof AppStore.userData.bloglist[folder] === 'undefined') {
            AppStore.userData.bloglist[folder] = [];
            this.saveSettings(function() {
                PubSub.publish('NEW_FOLDER_ADDED', folder);
            });
        }
    },

    saveSettings: function (successCallback) {
        var data = {
            'bloglist': AppStore.userData.bloglist,
            'username': AppStore.userData.username,
            'userSettings': AppStore.userData.userSettings
        };

        $.post('/SaveSettings', {
            'data': JSON.stringify(data)
        }, function () {
            if (typeof successCallback === 'function') {
                successCallback.call();
            }
        });
    },

    saveSettingsWithDelete: function(deleteFeed, successCallback) {
        var data = {
            'bloglist': AppStore.userData.bloglist,
            'username': AppStore.userData.username,
            'userSettings': AppStore.userData.userSettings
        };

        $.post('/SaveSettings?deleteFeed=' + deleteFeed, {
            'data': JSON.stringify(data)
        }, function() {
            if (typeof successCallback === 'function') {
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
        var folder;
        AppStore.foldersUnreadCount = {};

        for (folder in AppStore.userData.bloglist) {
            this.calcFolderUnreadCount(folder);
        }
    },

    calcFolderUnreadCount: function(folder) {
        var folderUnreadCount = 0, feedUrl;

        if (typeof AppStore.userData.bloglist === 'undefined') {
            return;
        }

        //get all folder feeds
        for (var i = 0; i < AppStore.userData.bloglist[folder].length; i++) {
            feedUrl = AppStore.userData.bloglist[folder][i].url;
            if (typeof AppStore.readData[feedUrl] !== 'undefined') {
                if (AppStore.readData[feedUrl].totalCount - AppStore.readData[feedUrl].readCount > 0) {
                    folderUnreadCount = folderUnreadCount + AppStore.readData[feedUrl].totalCount - AppStore.readData[feedUrl].readCount;
                }
            }
        }

        AppStore.foldersUnreadCount[folder] = folderUnreadCount;

    },

    changeFeedFolder: function(fromFolder, toFolder, url) {
        var decodedUrl = decodeURIComponent(url);
        var decodedFromFolder = decodeURIComponent(fromFolder); //todo shouldn't here be encodeURIComponent
        var decodedToFolder = decodeURIComponent(toFolder); //todo shouldn't here be encodeURIComponent

        //find and remove it
        $.each(AppStore.userData.bloglist[decodedFromFolder], function(i, feed) {
            if (feed.url === decodedUrl) {
                AppStore.userData.bloglist[decodedFromFolder].splice(i, 1);
                AppStore.userData.bloglist[decodedToFolder].push(feed);
                return false;
            }
        });

        this.saveSettings(function() {
            PubSub.publish('FEED_FOLDER_CHANGED', {
                'toFolder': toFolder,
                'feed': url
            });
        });

        this.calcFolderUnreadCount(decodedFromFolder);
        this.calcFolderUnreadCount(decodedToFolder);
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
        $.get('/GenerateUploadUrl', function(data) {
            successCallback.apply(this, [data]);
        });
    }
};

module.exports = AppUtils;
