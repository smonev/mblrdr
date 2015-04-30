'use strict';

let AppStore = require('./AppStore.js');
let AppMessages = require('./AppMessages.js');

let PubSub = require('pubsub-js');

let AppUtils = {

    scrollTo: function(scrollPos, interval) {

        Velocity(document.body, 'scroll', {
            duration: 250,
            offset: scrollPos,
            easing: 'easeOutQuad',

            // complete: function(elements) {
            //     Velocity(document.body, 'scroll', {
            //         duration: 1,
            //         offset: scrollPos
            //     });
            // }//.bind(this)
        });
    },

    morphElementToHeader: function(fromElement) {

        let newElement =  fromElement.target.cloneNode(true);

        newElement.style.cssText = //'color:#2172F7 !important;' +
            'font-size: 2.03em;color: #737373;cursor: pointer;overflow: hidden;white-space: nowrap;display: block;margin: 0px auto;padding: 20px 50px;text-transform: uppercase;' +
            //document.defaultView.getComputedStyle(document.querySelector('.headerCaption'), '').cssText +
            //document.defaultView.getComputedStyle(fromElement, '').cssText +
                ';position: absolute;top:' + $(fromElement.target).offset().top + 'px;left:' + ($(fromElement.target).offset().left - 100) + 'px';
        document.body.appendChild(newElement);

        fromElement.target.style.cssText = fromElement.target.style.cssText + 'visibility: hidden;';

        Velocity(newElement, {
                'top': '0px',
                'left': '18px',
                'opacity': 0.1
            }, {
                duration: 800,
                easing: 'easeOutQuad',
                //easing: 'easeOutElastic',
                complete: function(elements) {
                    newElement.parentNode.removeChild(newElement);
                }
            }
        );
    },

    markArticleAsRead: function(data) {
        if  (window.readonlyApp) {
            return;
        }

        let markReadData = {}, decodedUrl = decodeURIComponent(data.url);
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
        PubSub.publish(AppMessages.FOLDERS_UNREAD_COUNT_CHANGED, {});
    },

    starArticle: function(data) {
        $.post('/StarArticle', {
            'data': JSON.stringify(data)
        }, function(newdata, status, xhr) {
            //PubSub.publish('STAR_ARTICLE', JSON.parse(data));
        });
    },

    markFeedAsRead: function(folder, url) {
        let markReadData = {}, decodedUrl = decodeURIComponent(url), decodedFolder = decodeURIComponent(folder);
        markReadData[decodedUrl] = [];

        $.post('/MarkArticlesAsRead?read=1&allRead=1', {
            'data': JSON.stringify(markReadData)
        }, function(data, status, xhr) {
            PubSub.publish(AppMessages.MARK_READ_FEED, JSON.parse(data).feedUrl);
        });

        if (AppStore.readData[decodedUrl]) {
            AppStore.readData[decodedUrl].readCount = AppStore.readData[decodedUrl].totalCount;
        }
        AppStore.nextRequestFromServer[decodedUrl] = true;

        this.calcFolderUnreadCount(decodedFolder);
        PubSub.publish(AppMessages.FOLDERS_UNREAD_COUNT_CHANGED, {});
    },

    markFolderAsRead: function(folder) {
        let feeds = AppStore.userData.bloglist[folder];
        feeds.map(function (feed) {
            this.markFeedAsRead(folder, feed.url);
        }.bind(this));
        this.calcFolderUnreadCount(folder);
        PubSub.publish(AppMessages.FOLDERS_UNREAD_COUNT_CHANGED, {});
    },

    markAllFoldersAsRead: function() {
        Object.keys(AppStore.userData.bloglist).forEach(function(folder) {
            this.markFolderAsRead(folder);
        }.bind(this));
    },

    deleteFolder: function(folder) {
        delete AppStore.userData.bloglist[folder];
        this.saveSettings(function() {
            PubSub.publish(AppMessages.DELETE_FOLDER, folder);
            alert('Folder ' + folder + ' is deleted.');
        });
    },

    unsubscribeFeed: function(folder, feed) {
        function successUnsubscribe() {
            alert('You are now unsubscibed from ' + decodedFeed);
        }

        let decodedFeed = decodeURIComponent(feed);
        let decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        for (let i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
            if (AppStore.userData.bloglist[decodedFolder][i].url === decodedFeed) {
                AppStore.userData.bloglist[decodedFolder].splice(i, 1);
                this.saveSettingsWithDelete(decodedFeed, successUnsubscribe);
                break;
            }
        }
    },

    updateFeedTitleIfNeeded: function(folder, feed, title) {
        let decodedFeed = decodeURIComponent(feed);
        let decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        if (typeof AppStore.userData.bloglist === 'undefined') {
            return;
        }

        for (let i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
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
        let decodedFeed = decodeURIComponent(feed);
        let decodedFolder = decodeURIComponent(folder); //todo shouldn't here be encodeURIComponent

        for (let i = 0; i < AppStore.userData.bloglist[decodedFolder].length; i++) {
            if (AppStore.userData.bloglist[decodedFolder][i].url === decodedFeed) {
                return AppStore.userData.bloglist[decodedFolder][i].title;
            }
        }
    },

    getFeedData: function (feedUrl, successCallback) {
        let colorWheel = document.getElementById('colorWheel');
        let deg = 0;
        let inAnimation = false;
        let animationTimeoutID;
        let rafAnimationID;

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
        let decodedUrl = decodeURIComponent(feedUrl);

        if (AppStore.nextRequestFromServer[decodedUrl]) {
            AppStore.nextRequestFromServer[decodedUrl] = false;
            feedUrl = feedUrl + '&v=' + Math.random();
        } else {
            let d1 = new Date(); d1.setHours(0); d1.setMinutes(0); d1.setSeconds(0); d1.setMilliseconds(0);
            let d2 = new Date();
            let period =  ((d2 - d1) / 1000 / 60 ) % 60; //waaat :) // ok, get the minutes between two dates (not more than an hour). waat :)
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

        let decodedFeed = decodeURIComponent(feed);

        this.saveSettingsWithAdd(decodedFeed, function() {
            PubSub.publish(AppMessages.NEW_FEED_ADDED, {
                'folder': folder,
                'feed': feed
            });
        });
    },

    addNewFolder: function(folder) {
        if (typeof AppStore.userData.bloglist[folder] === 'undefined') {
            AppStore.userData.bloglist[folder] = [];
            this.saveSettings(function() {
                PubSub.publish(AppMessages.NEW_FOLDER_ADDED, folder);
            });
        }
    },

    saveSettings: function (successCallback) {
        let data = {
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
        let data = {
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

    saveSettingsWithAdd: function(newFeed, successCallback) {
        let data = {
            'bloglist': AppStore.userData.bloglist,
            'username': AppStore.userData.username,
            'userSettings': AppStore.userData.userSettings
        };

        $.post('/SaveSettings?newFeed=' + newFeed, {
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
            if (typeof successCallback === 'function') {
                successCallback.apply(this, [result]);
            } else {
                return result;
            }

        });
    },

    calcFoldersUnreadCount: function() {
        let folder;
        AppStore.foldersUnreadCount = {};

        for (folder in AppStore.userData.bloglist) {
            this.calcFolderUnreadCount(folder);
        }
    },

    calcFolderUnreadCount: function(folder) {
        let folderUnreadCount = 0, feedUrl;

        if (typeof AppStore.userData.bloglist === 'undefined') {
            return;
        }

        //get all folder feeds
        for (let i = 0; i < AppStore.userData.bloglist[folder].length; i++) {
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
        let decodedUrl = decodeURIComponent(url);
        let decodedFromFolder = decodeURIComponent(fromFolder); //todo shouldn't here be encodeURIComponent
        let decodedToFolder = decodeURIComponent(toFolder); //todo shouldn't here be encodeURIComponent

        //find and remove it
        $.each(AppStore.userData.bloglist[decodedFromFolder], function(i, feed) {
            if (feed.url === decodedUrl) {
                AppStore.userData.bloglist[decodedFromFolder].splice(i, 1);
                AppStore.userData.bloglist[decodedToFolder].push(feed);
                return false;
            }
        });

        this.saveSettings(function() {
            PubSub.publish(AppMessages.FEED_FOLDER_CHANGED, {
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
            PubSub.publish(AppMessages.FOLDERS_UNREAD_COUNT_CHANGED, {});
            PubSub.publish(AppMessages.FEED_READ_COUNT_CHANGED, {
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
