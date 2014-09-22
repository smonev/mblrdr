;

MblRdr = function() {
    "use strict";

    var feedsToRender, totalCost = 0;
    
    function loadFolderFeeds(folderName) {
        var $menuList = $(".menuList"), $articlesList = $(".articlesList");

        function setMenuHtml() {
            var i, folder, s = '', feedTitle = '';

            if (folderName === 'root') {
                for (folder in MblRdr.bloglist) {
                    if (folder !== 'root') {
                        s = s + '<li class="folder" data-title="' + folder + '"><a><span class="fa fa-folder"></span><span class="feedTitle">' + folder + '</span><span class="unreadCount"></span></a></li>';
                    }
                }
            }

            if (typeof MblRdr.bloglist[folderName] !== "undefined") {
                for (i = 0; i < MblRdr.bloglist[folderName].length; i++) {
                    if (typeof MblRdr.bloglist[folderName][i].title === "undefined") {
                        MblRdr.bloglist[folderName][i].title = MblRdr.bloglist[folderName][i].url;
                    }
                    feedTitle = (typeof MblRdr.bloglist[folderName][i].userTitle !== "undefined" && MblRdr.bloglist[folderName][i].userTitle !== "") ? MblRdr.bloglist[folderName][i].userTitle : MblRdr.bloglist[folderName][i].title;
                    s = s + '<li class="feed displayNone" data-title="' + feedTitle + '" data-cat="' + folderName + '" data-url="' + MblRdr.bloglist[folderName][i].url + '"><a><span class="fa fa-file"></span><span class="feedTitle">' + feedTitle + '</span><span class="unreadCount"></span></a></li>';
                }
            }

            // folders and feeds
            $menuList.html(s);

            // up button
            if (folderName !== 'root') {
                $(".up").html('<span class="fa fa-long-arrow-left"></span>');
            } else {
                $(".up").html('<span class="fa fa-home"></span>');
            }

            // title
            $(".headerCaption").html(folderName);
        }

        function fetchFolderFeeds(folderName) {
            var i;
            
            MblRdr.read = []; MblRdr.star = []; MblRdr.data = [];
            // promisses, async.js, sth else, when time (or not ?)

            if (typeof MblRdr.bloglist[folderName] === "undefined") {
                return;
            }
            feedsToRender = MblRdr.bloglist[folderName].length;
            for (i = 0; i < MblRdr.bloglist[folderName].length; i = i + 1) {

                getFeed({
                    'feedUrl': MblRdr.bloglist[folderName][i].url,
                    'feedFolder': folderName,
                    '$feedLi': $('ul').find('li[data-url="' + MblRdr.bloglist[folderName][i].url + '"]'),
                    'loadMultiple': false,
                    'nextcount': undefined,
                    'shouldRenderData': false,
                    'newFeed': false
                });
            }
        };

        setMenuHtml();

        MblRdr.currentFolderName = folderName;
        MblRdr.currentFeedName = '';

        fetchFolderFeeds(folderName);
        MblRdr.settings.enableSettings(folderName === "root" ? 1: 2);
        folderView();

        // click folder
        $menuList.find('li.folder').off('click').on('click', function() {
            pushState({
                folderName: $(this).data('title')
            });
        });

        // click feed
        $menuList.find('li.feed').off('click').on('click', function() {
            pushState({
                feedUrl: $(this).data('url'),
                folderName: $(this).data('cat')
            });

            return false;
        });

        // click up
        $('.up').off('click').on('click', function(event) {
            pushState({
                folderName: 'root'
            });
            return false;
        });
    };

    function loadAndRenderFeed(data) {
        var $feedLi = $('ul').find('li[data-url="' + data.feedUrl + '"]');

        MblRdr.currentFeedName = data.feedUrl;

        $('.selected').removeClass('selected');
        $(".articlesList").html("");

        $feedLi.addClass('selected');

        MblRdr.read = [];
        MblRdr.star = [];
        MblRdr.data = [];
        getFeed({
            'feedUrl': data.feedUrl,
            'feedFolder': data.folderName,
            '$feedLi': $feedLi,
            'loadMultiple': false,
            'nextcount': undefined,
            'shouldRenderData': true,
            'newFeed': false
        });
    }

    function fireMarkArticlesAsRead(markReadData, markAsUnread, allRead, successCallback) {

        var read = markAsUnread === true ? -1 : 1, allRead = allRead === true ? 1 : -1;

        function addToReadCache() {
            var readArticles;
            $.each(Object.keys(markReadData), function(j, key) {
                if (typeof MblRdr.readCache[key] === "undefined") {
                    MblRdr.readCache[key] = {};
                }

                if (typeof MblRdr.readCacheUnreadCount[key] === "undefined") {
                    MblRdr.readCacheUnreadCount[key] = 0;
                }

                readArticles = markReadData[key];
                $.each(readArticles, function(i, readArticle) {
                    MblRdr.readCache[key][readArticle] = read === 1;
                });

                if (allRead === 1) {
                    MblRdr.nextRequestFromServer[key] = true;
                }
            });
        }

        $.post("/MarkArticlesAsRead?read=" + read + '&allRead=' + allRead, {
            'data': JSON.stringify(markReadData)
        }, function(data, status, xhr) {
            if (typeof successCallback === 'function') {
                successCallback.call(null, data);
            }

            processXhr('MarkArticlesAsRead', xhr);
        });

        addToReadCache(allRead);
    };

    function updateFeedReadCount(url, data, markedAsUnread, sentData, markAll) {
        var $feedLi = $('ul').find('li.feed[data-url="' + url + '"]'), unreadCount = $feedLi.data('unread-count') || 0, decreaseCount;

        data = JSON.parse(data);

        if (markAll === true) {
            unreadCount = 0;
        } else if (data.unreadCount === 0) {
            unreadCount = data.unreadCount;
        } else if (data.unreadCount > 0) {
            unreadCount = data.unreadCount;
        } else {
            decreaseCount = 1;
            if (sentData[url].length > 0) {
                decreaseCount = sentData[url].length;
            }

            unreadCount = unreadCount + (markedAsUnread === true ? decreaseCount : decreaseCount * (-1));
            if (unreadCount < 0) {
                unreadCount = 0;
            }
        }

        if (unreadCount === 0) {
            $feedLi.removeClass('unread');
            $feedLi.find('.unreadCount').addClass('displayNone');
            $feedLi.find('.feedTitle').addClass('noUnreadCount');
        } else {
            $feedLi.addClass('unread');
            if ($feedLi.find('.feedTitle').hasClass('noUnreadCount')) {
                $feedLi.find('.unreadCount').removeClass('displayNone');
                $feedLi.find('.feedTitle').removeClass('noUnreadCount');
            }
        }

        $feedLi.find('.unreadCount').text(unreadCount);
        $feedLi.data('unread-count', unreadCount);
        MblRdr.readCacheUnreadCount[data.feedUrl] = unreadCount;
    }

    function renderData(feedUrl, feedFolder, $li, nextcount) {
        var entry, $articlesHeader = $('.articlesHeader'), $articlesList = $('.articlesList'), feedTitle;

        function getArticles() {
            var html = '', id, unread, i, star, entryAuthor = '', entryAuthorLine = '', showRead = false, feedNavigation, 
            fontColor = MblRdr.userSettings.nightmode === 2 ? 'rgb(248, 248, 242)': '#444444';

            if (shouldShowFeedArticles(MblRdr.currentFolderName, MblRdr.currentFeedName)) {
                showRead = true;
            }

            for (i = 0; i < MblRdr.data.length; i++) {
                entry = MblRdr.data[i];
                if (entry.rendered === true) {
                    continue
                }

                MblRdr.data[i].rendered = true;
                feedUrl = entry.feedUrl;

                unread = MblRdr.read.indexOf('' + entry.id + '') === -1 ? 'unread' : '';
                if (
                    (typeof MblRdr.readCache[feedUrl] !== "undefined") &&
                    (typeof MblRdr.readCache[feedUrl][entry.id] !== "undefined")
                ) {
                    unread = MblRdr.readCache[feedUrl][entry.id] ? '' : 'unread';
                }

                if ((!showRead) && (unread === '')) {
                    //continue;
                    unread = 'displayNone';
                }

                if (entry.author !== "") {
                    entryAuthor = "<br>" + entry.author;
                    entryAuthorLine = ", " + entry.author;
                }

                if ((typeof entry.title !== "undefined") && (entry.title !== "")) {
                    entry.title = entry.title.replace(/\n/g, '');
                }

                star = MblRdr.star.indexOf('' + entry.id + '') === -1 ? 'fa fa-star-o' : 'fa fa-star';
                if (
                    (typeof MblRdr.starCache[feedUrl] !== "undefined") &&
                    (typeof MblRdr.starCache[feedUrl][entry.id] !== "undefined")
                ) {
                    star = MblRdr.starCache[feedUrl][entry.id] ? 'fa fa-star' : 'fa fa-star-o';
                }

                if (entry.title === "") {
                    entry.title = Globalize.format(entry.publishedObject, 'MMM d');
                }

                html = html +
                    '<li data-url="' + feedUrl + '" data-id="' + entry.id + '" data-published="' + entry.published + '" class="article ' + unread + '">' +
                    '<section class="header">' +
                    '<a class="star"><span class="' + star + '"></span></a>' +
                    '<a href="' + entry.link + '" class="title">' + entry.title + '</a>' +
                    '<a href="' + entry.link + '" target="_blank" class="headerUrl"><span class="fa fa-external-link"></span><span class="authorAndDate">' + Globalize.format(entry.publishedObject, 'MMM d') + entryAuthor + '</span></a>' +
                    '<section class="contentHeader displayNone">' +
                    '<span class="title"> ' + entry.title + '</span> ' +
                //'<span class="fa fa-undo"></span>' + 
                '<span class="fa fa-angle-double-right"></span>' +
                    '<span class="fa fa-angle-double-left"></span>' +
                    '<span class="fa fa-angle-double-up displayNone"></span>' +
                    '<span class="fa fa-share displayNone"></span>' +
                    '<span class="fa fa-twitter displayNone"></span>' +
                    '<span class="fa fa-facebook displayNone"></span>' +
                    '<span class="fa fa-google-plus displayNone"></span>' +
                '<div class="contentSubHeader"> ' +
                    '<span class="date">' + Globalize.format(entry.publishedObject, 'MMM d') + entryAuthorLine + '</span>' +
                    '<a href="' + entry.link + '" target="_blank"><span class="fa fa-external-link"></span></a>' +
                    '</div>' +

                    '<div class="fontSizeContainer">' +
                    '    <span class="fa fa-minus"></span>' +
                    '    <span class="fa fa-font"></span> ' +
                    '    <span class="fa fa-plus"></span> ' +
                    '</div>' +
                    '</section>' +
                    '<section class="content" data-id="' + i + '">' +
                    '<p></p>' +
                    '</section></li>';
            }

            return html;
        }

        function fixImagesWidth($container) {
            var screenWidth = $('body').innerWidth() * 0.88; //88 because of margins, todo think of sth else here
            $container.find('img').each(function(i, el) {
                if ($(el).width() > screenWidth) {
                    $(el).addClass('imgScaled');
                }
            });
        }

        nextcount = nextcount || 0;

        feedTitle = $li.length > 0 ? $li.data('title') : (MblRdr.data.length > 0) ? MblRdr.data[0].feedTitle : '';
        $(".headerCaption").html(feedTitle);
        document.title = MblRdr.currentFolderName + ' | ' + feedTitle;

        $('.up').html('<span class="fa fa-long-arrow-left"></span>');
        $('.moreLink').remove();

        $articlesList.append(getArticles());
        $articlesList.append('<a class="moreLink" data-url="' + feedUrl + '" data-nextcount="' + nextcount + '"> <i class="fa fa-long-arrow-down"></i></a>');
        $articlesList.removeClass('displayNone');

        MblRdr.settings.enableSettings(3);
        MblRdr.shortcuts.initKeyboardEvents();

        $articlesList.find('.moreLink').off('click').on('click', function() {
            var nextcount = $(this).data('nextcount');
            if (nextcount === 0) {
                $(this).text('no older articles');
            } else {
                getFeed({
                    'feedUrl': $(this).data('url'),
                    'feedFolder': $('.menuList .selected').data('cat'),
                    '$feedLi': $('.menuList .selected'),
                    'loadMultiple': false,
                    'nextcount': nextcount,
                    'shouldRenderData': true,
                    'newFeed': false
                });
            }

            return false;
        });

        $('.up').off('click').on('click', function(event) {
            folderView();
            pushState({
                folderName: MblRdr.currentFolderName
            });

            $('.up').off('click').on('click', function(event) {
                pushState({
                    folderName: 'root'
                });
                return false;
            });

            MblRdr.currentFeedName = '';
            MblRdr.settings.enableSettings(2);

            return false;
        });

        $articlesList.find('a.title').off('click').on('click', function(event) {
            var $article = $(this).closest('li'), markReadData, url;

            function preloadNextTwoArticles() {
                var $nextArticle = $article.next();
                if ($nextArticle.length > 0) {
                    $nextArticle.find('.content').html(MblRdr.data[$article.find('.content').data('id')].content);
                    $nextArticle = $nextArticle.next();
                    if ($nextArticle.length > 0) {
                        $nextArticle.find('.content').html(MblRdr.data[$article.find('.content').data('id')].content);
                    }
                }
            }

            function clearStyle($article) {
                $article.find('.content *').removeAttr('style');
            }

            MblRdr.currentArticle = $article;

            $('.selectedArticle').removeClass('selectedArticle');
            MblRdr.currentArticle.find('.header').addClass('selectedArticle');

            if ($article.find('.content').css('display') === 'none') {
                $article.find('.footer').css('display', 'block');
                $article.find('.content').css('display', 'block').prev().removeClass('displayNone').css('display', 'block');
                $article.find('.content').html(MblRdr.data[$article.find('.content').data('id')].content);
                fixImagesWidth($article);
                //fixExternalLinks($article);
                clearStyle($article);
                $article.find('img').load(function() {
                    fixImagesWidth($article);
                });

                $article.find('.contentSubHeader .fa fa-star-o, .contentSubHeader .fa fa-star').off().on('click', function() {
                    $article.find('.star').trigger('click');
                });

                url = $article.data('url');
                $article.find('.fa.fa-undo').off('click').on('click', function() {
                    markReadData = {};
                    markReadData[url] = markReadData[url] || [];
                    markReadData[url].push($article.data('id'));

                    fireMarkArticlesAsRead(markReadData, true, false, function(data) {
                        updateFeedReadCount(url, data, true, markReadData, false);
                    });

                    $article.addClass('unread');
                    $article.find('.footer').css('display', 'none');
                    $article.find('.content').css('display', 'none').prev().addClass('displayNone').css('display', 'block'); //todo clean this up
                    $article.find('.content').html();
                });

                $article.find('.fa.fa-angle-double-right').off('click').on('click', function() {
                    MblRdr.shortcuts.openNextArticle();
                });

                $article.find('.fa.fa-angle-double-left').off('click').on('click', function() {
                    MblRdr.shortcuts.openPrevArticle();
                });

                $article.find('.fa.fa-angle-double-up').off('click').on('click', function() {
                    MblRdr.shortcuts.gotoTop()
                });

                $article.find('.fa.fa-minus').off('click').on('click', function() {
                    MblRdr.shortcuts.zoomContent(-1);
                });

                $article.find('.fa.fa-plus').off('click').on('click', function() {
                    MblRdr.shortcuts.zoomContent(1);
                });

                $article.find('.fa.fa-font').off('click').on('click', function() {
                    MblRdr.shortcuts.zoomContent(0);
                });

                $article.find('.fa.fa-share').off('click').on('click', function() {
                    $article.find('.fa.fa-twitter').removeClass('displayNone');
                    $article.find('.fa.fa-facebook').removeClass('displayNone');
                    $article.find('.fa.fa-google-plus').removeClass('displayNone');
                    //$article.find('.fa.fa-share').addClass('displayNone');
                });

                if (Modernizr.touch) {
                    MblRdr.shortcuts.initGestureEvents($article);
                }

                if ($article.hasClass('unread')) {
                    markReadData = {};
                    markReadData[url] = markReadData[url] || [];
                    markReadData[url].push($article.data('id'));

                    fireMarkArticlesAsRead(markReadData, false, false, function(data) {
                        updateFeedReadCount(url, data, false, markReadData, false);
                    });

                    $article.removeClass('unread');
                }
            } else {
                $article.find('.footer').css('display', 'none');
                $article.find('.content').css('display', 'none').prev().addClass('displayNone').css('display', 'block'); //todo clean this up
                $article.find('.content').html();
                $('.selectedArticle').removeClass('selectedArticle');
            }

            scrollTo($article.find('.contentHeader').offset().top, 300);

            preloadNextTwoArticles();
            return false;
        });

        $('.star').off('click').on('click', function() {
            var $this = $(this), $article, newStarState;

            function addToStarCache(feed, state, id) {
                if (typeof MblRdr.starCache[feed] === "undefined") {
                    MblRdr.starCache[feed] = {};
                }

                MblRdr.starCache[feed][id] = state === 1;
            }

            function starArticle(feed, state, id) {
                var data = {
                    'feed': feed,
                    'state': state,
                    'id': id
                }

                $.post("/StarArticle", {
                    'data': JSON.stringify(data)
                }, function(data, status, xhr) {
                    processXhr('StarArticle', xhr);
                });
            }

            $article = $this.closest('li');

            if ($this.find('.fa-star').length > 0) {
                $this.find('.fa-star').removeClass('fa-star').addClass('fa-star-o');
                $article.find('.contentSubHeader .fa-star').removeClass('fa-star').addClass('fa-star-o');
                newStarState = 0;
            } else {
                $this.find('.fa-star-o').removeClass('fa-star-o').addClass('fa-star');
                $article.find('.contentSubHeader .fa-star-o').removeClass('fa-star-o').addClass('fa-star');
                newStarState = 1;
            }

            starArticle($article.data('url'), newStarState, $article.data('id'));
            addToStarCache($article.data('url'), newStarState, $article.data('id'));

            return false;
        });

        if (!$('.moreLink').data('loading')) {
            $('.moreLink').data('loading', false);
            $.event.trigger('moreLinkCheck');
        }
    };

    function shouldShowFolder() {
        if (
            (typeof MblRdr.userSettings.showRead !== "undefined")
        ) {
            return MblRdr.userSettings[feedFolder].showRead
        }

        return true;
    };

    function shouldShowFeed(feedFolder) {
        if (
            (typeof MblRdr.userSettings[feedFolder] !== "undefined") &&
            (typeof MblRdr.userSettings[feedFolder].showRead !== "undefined")
        ) {
            return MblRdr.userSettings[feedFolder].showRead
        }

        return true;
    };

    function shouldShowFeedArticles(feedFolder, feed) {
        if (
            (typeof MblRdr.userSettings[feedFolder] !== "undefined") &&
            (typeof MblRdr.userSettings[feedFolder][feed] !== "undefined") &&
            (typeof MblRdr.userSettings[feedFolder][feed].showRead !== "undefined")
        ) {
            return MblRdr.userSettings[feedFolder][feed].showRead;
        }

        return true;
    };

    function getFeed(settings) {

        function saveTitle(feedUrl, feedFolder, feedTitle) {
            var i;
            for (i = 0; i < MblRdr.bloglist[feedFolder].length; i++) {
                if (MblRdr.bloglist[feedFolder][i].url === feedUrl) {
                    MblRdr.bloglist[feedFolder][i].title = feedTitle;
                    MblRdr.settings.saveSettings();
                }
            }
        }

        var firstBatch, forceGetFromServer = '';

        settings.nextcount = settings.nextcount || -1;
        firstBatch = settings.nextcount === -1;
        settings.feedFolder = settings.feedFolder ? settings.feedFolder.toString() : 'root';
        settings.newFeed = settings.newFeed ? 1 : 0;
        feedView(settings.$feedLi);

        showSpinner();

        if (typeof MblRdr.lastVersion[settings.feedUrl] !== "undefined") {
            // if last request was from server with "v=" => use last "v="", so correct cached feed is returned
            forceGetFromServer = MblRdr.lastVersion[settings.feedUrl];
        }

        if (MblRdr.nextRequestFromServer[settings.feedUrl] === true) {
            forceGetFromServer = '&v=' + Math.random(); // +1
            MblRdr.nextRequestFromServer[settings.feedUrl] = false;
            MblRdr.lastVersion[settings.feedUrl] = forceGetFromServer;
        }

        if (forceGetFromServer === "") {
            // if this is first time or refresh (f5), make sure the data is from the server
            forceGetFromServer = '&v=' + Math.random(); // +1 always get from server if not sure
            MblRdr.lastVersion[settings.feedUrl] = forceGetFromServer;
        }
        if (settings.feedUrl === '') {
            console.log('empty feed')
            return
        }
        $.getJSON('/feed/' + encodeURIComponent(settings.feedUrl) + '?count=' + settings.nextcount + '&newFeed=' + settings.newFeed + forceGetFromServer).done(function(data, status, xhr) {
            var $articlesList = $('.articlesList'), i, readData, starData, unreadCount;

            hideSpinner();

            MblRdr.read = MblRdr.read || [];
            MblRdr.star = MblRdr.star || [];
            MblRdr.data = MblRdr.data || [];
            data.feed = data.feed !== "" ? JSON.parse(data.feed) : [];

            if (settings.shouldRenderData) {
                if ((settings.loadMultiple) || (!firstBatch)) {
                    for (i = 0; i < data.feed.length; i++) {
                        data.feed[i].publishedObject = new Date(data.feed[i].published);
                        data.feed[i].feedUrl = settings.feedUrl;
                        data.rendered = false;
                        MblRdr.data.push(data.feed[i]);
                    }
                    MblRdr.data = MblRdr.data.sort(function(a, b) {
                        return b.publishedObject - a.publishedObject
                    });

                    readData = data.read.split(',');
                    for (i = 0; i < readData.length; i++) {
                        MblRdr.read.push(readData[i]);
                    }

                    starData = data.star.split(',');
                    for (i = 0; i < starData.length; i++) {
                        MblRdr.star.push(starData[i]);
                    }
                } else {
                    MblRdr.read = data.read.split(',');
                    MblRdr.star = data.star.split(',');
                    MblRdr.data = data.feed;

                    for (i = 0; i < data.feed.length; i++) {
                        data.feed[i].publishedObject = new Date(data.feed[i].published);
                        data.feed[i].feedUrl = settings.feedUrl;
                    }
                    MblRdr.data = MblRdr.data.sort(function(a, b) {
                        return b.publishedObject.getTime() - a.publishedObject.getTime()
                    });

                    MblRdr.currentArticle = [];

                    if ((data.feed) && (data.feed.length > 0) && (data.feed[0].feedTitle !== "undefined")) {
                        if (settings.$feedLi.data('title') !== data.feed[0].feedTitle) {
                            saveTitle(settings.feedUrl, settings.feedFolder, data.feed[0].feedTitle);
                        }
                    }

                    renderData(settings.feedUrl, settings.feedFolder, settings.$feedLi, data.nextcount);
                }
            }

            if (shouldShowFeed(MblRdr.currentFolderName)) {
                settings.$feedLi.removeClass('displayNone');
            }

            if (typeof MblRdr.readCacheUnreadCount[settings.feedUrl] !== "undefined") {
                unreadCount = MblRdr.readCacheUnreadCount[settings.feedUrl];
            } else {
                unreadCount = data.article_count - data.read_count;
            }

            if (unreadCount > 0) {
                settings.$feedLi.addClass('unread').removeClass('displayNone').data('unread-count', unreadCount);
                settings.$feedLi.find('.unreadCount').text(typeof MblRdr.readCacheUnreadCount[settings.feedUrl] !== "undefined" ? MblRdr.readCacheUnreadCount[settings.feedUrl] : unreadCount);
            } else {
                settings.$feedLi.find('.unreadCount').addClass('displayNone');
                settings.$feedLi.find('.feedTitle').addClass('noUnreadCount');
            }

            processXhr('getJson feed', xhr);
        })
            .always(function(data) {
                if ((settings.loadMultiple) || (!firstBatch)) {
                    feedsToRender = feedsToRender - 1;
                    if ((feedsToRender === 0) || (!firstBatch)) {
                        if (settings.shouldRenderData) {
                            renderData('', settings.feedFolder, settings.$feedLi, data.nextcount);
                        }
                    }
                }
            });
    };

    function scrollTo(scrollPos, interval) {
        $('html, body').animate({
            scrollTop: scrollPos
        }, interval);
    };

    function feedView($li) {
        $('.menu').css('display', 'none');
        if ($li.length > 0) {
            $('.articlesHeader').find('.headerCaption').text($li.data('title'));
        }
        $('.articlesHeader').removeClass('displayNone');
    }

    function folderView() {
        $('.menu').css('display', 'block');
        $('.articlesHeader').addClass('displayNone');
        $('.articlesList').addClass('displayNone');
    }

    function showSpinner() {
        $('.fa fa-spinner').removeClass('displayNone');
    }

    function hideSpinner() {
        setTimeout(function() {
            $('.fa fa-spinner').addClass('displayNone');
        }, 400);
    }

    function moreLinkEvents() {
        $(window).bind('moreLinkCheck', function() {
            function continueFetching() {
                // if read articles are shown
                if ((typeof MblRdr.userSettings[MblRdr.currentFolderName] === "undefined") ||
                    (typeof MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName] === "undefined") ||
                    (MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName].showRead === true)) {
                    return true;
                }

                // if only unread articles are shown, chek there are still unread articles
                if ($('.article.unread').length === $('.selected').data('unreadCount')) {
                    return false;
                }

                return true;
            }

            function isElementInViewport(el) {
                if (el.length === 0) {
                    return false;
                }

                var rect = el[0].getBoundingClientRect();

                return (
                    (rect.top > 0 || rect.left > 0) &&
                    rect.top >= 0 && rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            }

            var $moreLink = $('.moreLink');

            if ($moreLink.data('loading') === true) {
                return;
            }

            if ((isElementInViewport($moreLink)) && (continueFetching())) {
                $moreLink.trigger('click').data('loading', true);
            }
        });

        $(window).on('DOMContentLoaded load resize scroll', function() {
            $.event.trigger('moreLinkCheck');
        });
    }

    function pushState(appState) {
        var urlState = '?folderName=root';

        // don't push the folder in the url (privacy)
        // if ((typeof appState.feedUrl !== "undefined") && (typeof appState.folderName !== "undefined")) {
        //     urlState = '?feedUrl=' + appState.feedUrl + '&folderName=' + appState.folderName;
        // } else if (typeof appState.folderName !== "undefined") {
        //     urlState = '?folderName=' + appState.folderName;
        // }

        if ((typeof appState.feedUrl !== "undefined") && (typeof appState.folderName !== "undefined")) {
            urlState = '?feedUrl=' + appState.feedUrl;
        }

        History.pushState(appState, appState.folderName ? appState.folderName: 'root', urlState);
    }

    function processXhr(caller, xhr) {
        if (xhr.getResponseHeader('X-AppEngine-Estimated-CPM-US-Dollars') === null) {
            return
        }
        var cost = parseFloat(xhr.getResponseHeader('X-AppEngine-Estimated-CPM-US-Dollars').replace("$",""))
        totalCost = totalCost + cost;

        console.log(caller + ':' + cost);
        console.log('total: ' + ':' + totalCost);
        //todo persist this
    }

    function getReadData() {
        var str = '/GetUserReadData';
        $.getJSON(str, function(data) {
            var folder, feedUrl;
            function updateFeedUnreadCount(url, urlData) {
                var $feedLi = $('ul').find('li.feed[data-url="' + url + '"]'), unreadCount;

                unreadCount = urlData.totalCount - urlData.readCount;

                if (unreadCount === 0) {
                    $feedLi.removeClass('unread');
                    $feedLi.find('.unreadCount').addClass('displayNone');
                    $feedLi.find('.feedTitle').addClass('noUnreadCount');
                } else {
                    $feedLi.addClass('unread');
                    if ($feedLi.find('.feedTitle').hasClass('noUnreadCount')) {
                        $feedLi.find('.unreadCount').removeClass('displayNone');
                        $feedLi.find('.feedTitle').removeClass('noUnreadCount');
                    }
                }

                $feedLi.find('.unreadCount').text(unreadCount);
                $feedLi.data('unread-count', unreadCount);
                MblRdr.readCacheUnreadCount[data.feedUrl] = unreadCount;
            }

            $.each(Object.keys(data), function(j, url) {
                updateFeedUnreadCount(url, data[url]); 
            });

            for (folder in MblRdr.bloglist) {
                var folderUnreadCount = 0;

                //get all folder feeds
                for (var i=0; i < MblRdr.bloglist[folder].length; i++) {
                    feedUrl = MblRdr.bloglist[folder][i].url;
                    if (typeof data[feedUrl] !== "undefined") {
                        if (data[feedUrl].totalCount - data[feedUrl].readCount > 0) {
                            folderUnreadCount = folderUnreadCount + data[feedUrl].totalCount - data[feedUrl].readCount
                        }
                    } else {
                        //console.log('no data for ' + feedUrl);
                    }
                }
                // set folder count
                $('li.folder[data-title="' + folder + '"]').data('unread', folderUnreadCount);
                if (folderUnreadCount > 0) {
                    $('li.folder[data-title="' + folder + '"]').find('.unreadCount').text(folderUnreadCount);
                }
                
                console.log('folder ' + folder + ' unread count: ' + folderUnreadCount)
            }

        });
    }


    return {
        bloglist: 0,
        readCache: {},
        starCache: {},
        readCacheUnreadCount: {},
        nextRequestFromServer: {},
        lastVersion: {},
        loadFolderFeeds: loadFolderFeeds,
        fireMarkArticlesAsRead: fireMarkArticlesAsRead,
        scrollTo: scrollTo,
        getFeed: getFeed,
        updateFeedReadCount: updateFeedReadCount,
        folderView: folderView,
        moreLinkEvents: moreLinkEvents,
        pushState: pushState,
        loadAndRenderFeed: loadAndRenderFeed,
        getReadData: getReadData
    }
}();

$(document).ready(function() {
    MblRdr.settings.getSettings();
    MblRdr.getReadData();
    MblRdr.moreLinkEvents();
});

$(document).ready(function() {
    History.Adapter.bind(window, 'statechange', function() {
        var state = History.getState();
        if ((typeof state.data.feedUrl !== "undefined") && (typeof state.data.folderName !== "undefined")) {
            MblRdr.loadAndRenderFeed(state.data);
        } else if (typeof state.data.folderName !== "undefined") {
            MblRdr.loadFolderFeeds(state.data.folderName);
            if (state.data.folderName === 'root') {
                MblRdr.getReadData();
            }
        } else {
            MblRdr.loadFolderFeeds('root');
            MblRdr.getReadData();
        }
    });
});

$(function() {
    FastClick.attach(document.body);
});