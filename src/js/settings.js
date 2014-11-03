;

MblRdr.settings = function() {
    "use strict";
    var $feedSettings;

    function close() {
        $feedSettings.addClass('displayNone');
    };

    function show(settingsType) {
        $feedSettings = $(".feedSettings");
        $feedSettings.removeClass('displayNone');

        if (settingsType === 'root') {
            $feedSettings.find('.changeFolderSetting').addClass('displayNone');
            $feedSettings.find('.deleteFolder').addClass('displayNone');
        } else if (settingsType === 'folder') {
            $feedSettings.find('.changeFolderSetting').addClass('displayNone');
            $feedSettings.find('.deleteFolder').removeClass('displayNone');
        } else if (settingsType === 'feed') {
            $feedSettings.find('.changeFolderSetting').removeClass('displayNone');
            $feedSettings.find('.deleteFolder').removeClass('displayNone');
        }

        $feedSettings.find('.close').off('click').on('click', function() {
            MblRdr.settings.close();
        });

        $feedSettings.click(function(event) {
            event.stopPropagation();
        });

        $('html').click(function() {
            close();
        });
    };

    function showHideEvent(level) {
        $feedSettings.find('.showHideOption').off('click').on('click', function() {
            var showHideType = $(this).data('val'), $articles = level === 2 ? $('.articlesList').find('.article') : $('.menuList > li');

            $('.menu').find('.selected').removeClass('selected');
            $(this).addClass('selected');

            if (level === 0) { //root
                MblRdr.userSettings.showRead = showHideType === 1 ? true : false;
            } else if (level === 1) { //folder
                if (typeof MblRdr.userSettings[MblRdr.currentFolderName] === "undefined") {
                    MblRdr.userSettings[MblRdr.currentFolderName] = {};
                }

                MblRdr.userSettings[MblRdr.currentFolderName].showRead = showHideType === 1 ? true : false;
            } else { //feed
                if (typeof MblRdr.userSettings[MblRdr.currentFolderName] === "undefined") {
                    MblRdr.userSettings[MblRdr.currentFolderName] = {};
                }

                if (typeof MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName] === "undefined") {
                    MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName] = {};
                }

                MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName].showRead = showHideType === 1 ? true : false;
            }

            $articles.each(function(i, article) {
                var $article = $(article);
                if ($(article).hasClass('unread')) {
                    $article.removeClass('displayNone');
                } else if (showHideType === 1) {
                    $article.removeClass('displayNone');
                } else if (showHideType === 2) {
                    $article.addClass('displayNone');
                }
            });

            saveSettings(function() {
                close();
            });

            close();
        })
    };

    function fillChangeFolderSelect(currentFolder) {
        var folder, selected, html = '';

        for (folder in MblRdr.bloglist) {
            selected = folder === MblRdr.currentFolderName ? 'selected' : '';
            folder = MblRdr.Utils.htmlEncode(folder);
            html = html + '<option class="' + selected + '">' + folder + '</option>';
        }

        $feedSettings.find('.changeFolderSetting select').html(html);
    };


    function addFeed() {
        var newFeed = $('.feedUrl').val(), selectedCategory = $('.settingsTitle:visible').val(), $newLi;

        if (typeof MblRdr.bloglist[selectedCategory] === "undefined") {
            MblRdr.bloglist[selectedCategory] = []
        };

        MblRdr.bloglist[selectedCategory].push({
            'url': newFeed,
            'title': newFeed
        });

        MblRdr.read = []; MblRdr.star = []; MblRdr.data = [];

        $('.menuList').append('<li class="feed" data-title="' + newFeed + '" data-cat="' + selectedCategory + '" data-url="' + newFeed + '"><a href="#"><span class="fa fa-file"></span><span class="feedTitle">' + newFeed + '</span><span class="unreadCount"></span></a></li>');
        $newLi = $('.menuList').find('li:last')

        // MblRdr.getFeed({
        //     'feedUrl': $newLi.data('url'),
        //     'feedFolder': $newLi.data('cat'),
        //     '$feedLi': $newLi,
        //     'loadMultiple': false,
        //     'nextcount': undefined,
        //     'shouldRenderData': true,
        //     'newFeed': true
        // });

        close();

        saveSettingsWithAdd(newFeed, function() {
            $('.feedUrl').val("");
        });

        $('.menu').css('display', 'none');
        $('.articlesHeader').removeClass('displayNone');
        $('.articlesList').html('').removeClass('displayNone');

        $newLi.click(function() {

            function showSpinner() {
                //$('.fa fa-spinner').removeClass('displayNone');
                var html = '<div class="loader" style="width 100%; text-align:center;">Loading ... <i class="fa fa-refresh fa-spin"></i></div>';
                $('.articlesList').prepend(html);
            }

            function hideSpinner() {
                $('.articlesList').find('.loader').remove();
                //setTimeout(function() {
                //    $('.fa fa-spinner').addClass('displayNone');
                //}, 400);
            }

            showSpinner();

            MblRdr.currentFeedName = $(this).data('url');

            $('.selected').removeClass('selected');
            $(this).addClass('selected');

            MblRdr.read = []; MblRdr.star = []; MblRdr.data = [];

            // todo check in 5, 10, 20 seconds, promisses
            setTimeout(function() {
                MblRdr.getFeed({
                    'feedUrl': $newLi.data('url'),
                    'feedFolder': $newLi.data('cat'),
                    '$feedLi': $newLi,
                    'loadMultiple': false,
                    'nextcount': undefined,
                    'shouldRenderData': true,
                    'newFeed': false
                });

                MblRdr.scrollTo(0);
            }, 10000);

            return false;
        }).trigger('click');


        return false;
    }

    function addFolder () {
        var newFolder = $('.feedUrl:visible').val();
        if ((newFolder !== null) && (newFolder !== '')) {
            MblRdr.bloglist[newFolder] = [];
            saveSettings(function() {
                close();
                MblRdr.pushState({
                    folderName: newFolder
                });
            });
        }
    }

    function enableOpmlImport() {
        //import opml
        $('.addOpml').off('click').on('click', function() {
            var $this = $(this);
            $this.closest('form').submit();
            return false;
        });

        $('.opmlFile').change(function() {
            var fileName = $('.opmlFile').val();
            fileName = fileName.match(/[^\/\\]+$/);

            $('.opmlFilePath').text(fileName).css('display', 'inline-block');
            if (fileName !== "") {
                $('.addOpml').show();
            } else {
                $('.addOpml').hide();
            }
        });
    }

    function enableNightmode() {
        $feedSettings.find('.nightmodeOption').off('click').on('click', function() {
            var nightmode = $(this).data('val');

            if (nightmode === 2) {
                $('body').addClass('nightmode');
            } else {
                $('body').removeClass('nightmode');
            }

            MblRdr.userSettings.nightmode = nightmode;
            saveSettings();
            close();
        });
    }

    function enableAddSettings() {
        $feedSettings.find('.addFeedSetting .inputType').off('click').on('click', function() {
            var $this = $(this);
            $('.inputType.selected').removeClass('selected');
            $this.addClass('selected');

            if ($this.data('addtype') === "feed") {
                $('.feedUrl').attr('placeholder', 'add feed').text('').removeClass('displayNone');
                $('.addFeedUrl').removeClass('displayNone');
                $('.omplImportForm').addClass('displayNone');
            } else if ($this.data('addtype') === "folder") {
                $('.feedUrl').attr('placeholder', 'add folder').text('').removeClass('displayNone');
                $('.addFeedUrl').removeClass('displayNone');
                $('.omplImportForm').addClass('displayNone');
            } else if ($this.data('addtype') === "opml") {
                $('.feedUrl').attr('placeholder', 'Import OPML').text('').addClass('displayNone');
                $('.addFeedUrl').addClass('displayNone');
                $('.omplImportForm').removeClass('displayNone');
            }
        });

        //add feed
        $('.addFeedUrl').off('click').on('click', function() {
            var $selectedAdd = $('.inputType.selected');
            if ($selectedAdd.data('addtype') === "feed") {
                addFeed();
            } else if ($selectedAdd.data('addtype') === "folder") {
                addFolder();
            } else if ($selectedAdd.data('addtype') === "opml") {
                addOpml();
            }
        });

        enableOpmlImport();
        $feedSettings.find('.addFeedSetting .inputType:first').trigger('click');
    }

    function setNightmodeState() {
        if ((typeof MblRdr.userSettings.nightmode !== "undefined") && (MblRdr.userSettings.nightmode === 2)) {
            $('.nightmodeOption.first:visible').removeClass('selected');
            $('.nightmodeOption.second:visible').addClass('selected');
        } else {
            $('.nightmodeOption.first:visible').addClass('selected');
            $('.nightmodeOption.second:visible').removeClass('selected');
        }
    }

    function setShowHideReadState(level) {
        //todo clean this mess

        var showRead = true;

        if (level === 0) { //root
            if (typeof MblRdr.userSettings.showRead !== "undefined") {
                showRead = MblRdr.userSettings.showRead;
            }
        } else if (level === 1) { //folder
            if (
                (typeof MblRdr.userSettings[MblRdr.currentFolderName] !== "undefined") &&
                (typeof MblRdr.userSettings[MblRdr.currentFolderName].showRead !== "undefined")
            ) {
                showRead = MblRdr.userSettings[MblRdr.currentFolderName].showRead;
            }
        } else { //feed
            if (
                (typeof MblRdr.userSettings[MblRdr.currentFolderName] !== "undefined") &&
                (typeof MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName] !== "undefined") &&
                (typeof MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName].showRead !== "undefined")
            ) {
                showRead = MblRdr.userSettings[MblRdr.currentFolderName][MblRdr.currentFeedName].showRead;
            }
        }

        $('.showHideOption.selected').removeClass('selected');
        if (showRead) {
            $('.showHideOption.first:visible').addClass('selected');
        } else {
            $('.showHideOption.second:visible').addClass('selected');
        }

    }

    function enableRenameFolder() {
        var $settingHeader = $('.settingHeader'), $submitButton = $settingHeader.find('.fa-check');

        function renameFolder() {
            var oldName = $settingHeader.find('.settingsTitle').data('foldertitle'), newName = $settingHeader.find('.settingsTitle').val();

            newName = MblRdr.Utils.htmlEncode(newName);

            MblRdr.bloglist[newName] = MblRdr.bloglist[oldName];
            delete MblRdr.bloglist[oldName];
            saveSettings(function() {
                close();
                MblRdr.pushState({
                    folderName: newName
                });
            });
        }

        $submitButton.hide();

        $settingHeader.find('.settingsTitle').off('keypress').on('keypress', function() {
            //
            if (!$submitButton.is(':visible')) {
                $submitButton.show();
            }
        });

        $submitButton.off('click').on('click', function() {
            renameFolder();
        })
    }

    function enableChangeFolder() {
        //change feed folder
        $('.changeFolder').off('click').on('click', function() {
            var newFolder = $('.changeFolderSetting select').val(), movedFeed;

            //find and remove it
            $.each(MblRdr.bloglist[MblRdr.currentFolderName], function(i, feed) {
                if (feed.url === MblRdr.currentFeedName) {
                    MblRdr.bloglist[MblRdr.currentFolderName].splice(i, 1);
                    movedFeed = feed;
                    return false;
                }
            });

            //add it
            if (typeof movedFeed !== "undefined") {
                MblRdr.bloglist[newFolder].push(movedFeed);

                saveSettings(function() {
                    close();
                    MblRdr.pushState({
                        folderName: newFolder
                    });
                });
            } else {
                //close();
            }

            return false;
        });
    }

    function deleteFolderSetting(){
        $('.feedUnsubscribe').off('click').on('click', function() {
            var result, folderToDelete;

            folderToDelete = $('.settingsTitle').val();
            result = window.confirm("Are you sure you want to delete '" + folderToDelete + "' folder ?");
            if (result === true) {
                delete MblRdr.bloglist[folderToDelete];
                saveSettings(function() {
                    close();
                    MblRdr.pushState({
                        folderName: 'root'
                    });
                });
            }
        });
    }

    function unsubscribeFeed() {
        //unsubscribe feed
        $feedSettings.find('.feedUnsubscribe').off('click').on('click', function() {

            function confirmUnsubscribe(feedName) {
                return window.confirm("Are you sure you want to ubsubscribe from '" + feedName + "' feed ?");
            }

            var i;
            if (confirmUnsubscribe($('.articlesHeader').find('.headerCaption').text())) {
                for (i = 0; i < MblRdr.bloglist[MblRdr.currentFolderName].length; i++) {
                    if (MblRdr.bloglist[MblRdr.currentFolderName][i].url === MblRdr.currentFeedName) {
                        MblRdr.bloglist[MblRdr.currentFolderName].splice(i, 1);
                        saveSettingsWithDelete(MblRdr.currentFeedName, function() {
                            alert('You are now unsubscibed from "' + $('.articlesHeader').find('.headerCaption').text() + '".');
                            close();
                            $('.up').click();
                        });
                        break;
                    }
                }
            }
        });
    }

    function markReadSettingsFeed() {
        $feedSettings.find('.markReadOption').off('click').on('click', function() {
            var markType = $(this).data('val'), now = new Date(), oneDay = 24 * 60 * 60 * 1000, url, markReadData = {};

            if (markType === 1) {
                url = $('.articlesList').find('.article:first').data('url')
                markReadData[url] = markReadData[url] || [];
                $('.articlesList').find('.article.unread').removeClass('unread');
            }

            $('.articlesList').find('.article.unread').each(function(i, article) {
                var $article = $(article), articlePublished, diffDays;
                // todo, this will not work if these are different urls
                url = $article.data('url')

                function readArticle() {
                    markReadData[$article.data('url')] = markReadData[$article.data('url')] || [];
                    markReadData[$article.data('url')].push($article.data('id'));
                    $article.removeClass('unread');
                }

                articlePublished = new Date($article.data('published'));
                diffDays = Math.round(Math.abs((now.getTime() - articlePublished.getTime()) / (oneDay)));

                if ((markType === 2) && (diffDays > 0)) {
                    readArticle();
                } else if ((markType === 3) && (diffDays > 7)) {
                    readArticle();
                }
            });

            MblRdr.fireMarkArticlesAsRead(markReadData, false, markType === 1, function(data) {
                MblRdr.updateFeedReadCount(url, data, false, markReadData, markType === 1);
            });

            close();
        })
    }

    function markReadSettingsFolder() {
            $feedSettings.find('.markReadOption').off('click').on('click', function() {
                var markType = $(this).data('val');

                $('.menuList li.unread').each(function(i, el) {
                    var $feed = $(this), readData = {}, url;

                    if (markType === 1) {
                        url = $feed.data('url')
                        readData[url] = readData[url] || [];
                        $('.articlesList').find('.article.unread').removeClass('unread');
                    }

                    // give the server some time between requests
                    (function(el) {
                        setTimeout(function() {
                            $(el).find('.fa.fa-file').removeClass('fa-file').addClass('fa-spinner fa-spin');
                            MblRdr.fireMarkArticlesAsRead(readData, false, markType === 1, function(data) {
                                $(el).find('.fa-spinner').removeClass('fa-spinner fa-spin').addClass('fa fa-file');
                                MblRdr.updateFeedReadCount(url, data, false, readData, markType === 1);
                            });
                        }, i * 1000);
                    })(el);

                });
                close();
            })
    }

    function enableSettings(settingType) {
        var $menuList = $(".menuList"), $articlesList = $(".articlesList"), $articlesHeader = $('.articlesHeader');
        //1 root, 2 folder, 3 feed

        $('.feedSettingsAction').off('click').on('click', function() {
            if (settingType === 3) {
                show('feed');
                $feedSettings.find('.settingsTitle').val($articlesHeader.find('.headerCaption').text());
                unsubscribeFeed();
                markReadSettingsFeed();
                $feedSettings.find('.feedUnsubscribe').find('.deleteText').text('unsubscribe');
            } else {
                show(settingType === 1 ? 'root' : 'folder');
                $feedSettings.find('.settingsTitle').val(MblRdr.currentFolderName).data('foldertitle', MblRdr.currentFolderName);
                deleteFolderSetting();
                markReadSettingsFolder();
                $feedSettings.find('.feedUnsubscribe').find('.deleteText').text('delete folder');
            }

            showHideEvent(settingType - 1);
            setShowHideReadState(settingType - 1);

            fillChangeFolderSelect(MblRdr.currentFolderName);

            enableAddSettings();
            enableChangeFolder();
            enableRenameFolder();

            enableNightmode();
            setNightmodeState();

            return false;
        });
    }

    function saveSettingsWithAdd(newFeed, successCallback) {
        var data = {
            "bloglist": MblRdr.bloglist,
            "username": MblRdr.username,
            "someSetting": "someValue",
            "userSettings": MblRdr.userSettings
        };

        if (typeof MblRdr.bloglist.newFeed !== "undefined") {
            feed = MblRdr.bloglist.newFeed
        }

        $.post("/SaveSettings?newFeed=" + newFeed, {
            'data': JSON.stringify(data)
        }, function() {
            if (successCallback && typeof(successCallback) === "function") {
                successCallback.call();
            }
        });
    }

    function saveSettingsWithDelete(deleteFeed, successCallback) {
        var data = {
            "bloglist": MblRdr.bloglist,
            "username": MblRdr.username,
            "someSetting": "someValue",
            "userSettings": MblRdr.userSettings
        };

        if (typeof MblRdr.bloglist.newFeed !== "undefined") {
            feed = MblRdr.bloglist.newFeed
        }

        $.post("/SaveSettings?deleteFeed=" + deleteFeed, {
            'data': JSON.stringify(data)
        }, function() {
            if (successCallback && typeof(successCallback) === "function") {
                successCallback.call();
            }
        });
    }

    function saveSettings(successCallback) {
        var data = {
            "bloglist": MblRdr.bloglist,
            "username": MblRdr.username,
            "someSetting": "someValue",
            "userSettings": MblRdr.userSettings
        };

        if (typeof MblRdr.bloglist.newFeed !== "undefined") {
            feed = MblRdr.bloglist.newFeed
        }

        $.post("/SaveSettings", {
            'data': JSON.stringify(data)
        }, function() {
            if (successCallback && typeof(successCallback) === "function") {
                successCallback.call();
            }
        });
    };

    function getSettings() {
        var str = '/GetUserFeeds';
        $.getJSON(str, function(data) {
            function getURLParameter(name) {
                return decodeURI(
                    //black box starts here
                    (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
                    //black box ends here
                );
            }

            MblRdr.bloglist = data.bloglist;
            MblRdr.username = data.username;
            if (typeof data.userSettings !== "undefined") {
                MblRdr.userSettings = data.userSettings;
                MblRdr.userSettings.nightmode = data.userSettings.nightmode ? data.userSettings.nightmode: 1;
            } else {
                MblRdr.userSettings = {};
                MblRdr.userSettings.nightmode = 1;
            }



            var folderName = getURLParameter('folderName'),
            feedUrl = getURLParameter('feedUrl'),
            state = {}, historyState = History.getState();

            if ((folderName !== "null") && (feedUrl !== "null")) {
                state = {
                    feedUrl: feedUrl,
                    folderName: folderName
                }

                if (JSON.stringify(state) !== JSON.stringify(historyState.data)) {
                    MblRdr.pushState(state);
                } else {
                    MblRdr.loadAndRenderFeed(historyState.data);
                }
            } else if (folderName !== "null") {
                state = {
                    folderName: folderName
                };

                if (JSON.stringify(state) !== JSON.stringify(historyState.data)) {
                    MblRdr.pushState(state);
                } else {
                    MblRdr.loadFolderFeeds(historyState.data.folderName);
                }
            } else {
                state = {
                    folderName: 'root'
                }

                if (JSON.stringify(state) !== JSON.stringify(historyState.data)) {
                    MblRdr.pushState(state);
                } else {
                    MblRdr.loadFolderFeeds('root');
                }
            }

            if (typeof MblRdr.userSettings.nightmode !== "undefined") {
                if (MblRdr.userSettings.nightmode === 2) {
                    $('body').addClass('nightmode');
                } else {
                    $('body').removeClass('nightmode');
                }
            }

        });
    };

    return {
        close: close,
        enableSettings: enableSettings,
        saveSettings: saveSettings,
        getSettings: getSettings
    };
}();
