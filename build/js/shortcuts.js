;

MblRdr.shortcuts = function() {
    "use strict";

    function openNextArticle() {
        findNextArticle();
        openCurrentArticle();
    }

    function openPrevArticle() {
        if (findPrevArticle()) {
            openCurrentArticle();
        };
    }

    function findNextArticle() {
        var nextCanidate;
        if ((typeof MblRdr.currentArticle !== "undefined") && (MblRdr.currentArticle.length > 0)) {
            nextCanidate = MblRdr.currentArticle.nextAll(':visible:first');
            if ((typeof nextCanidate !== "undefined") && (nextCanidate.length > 0)) {
                MblRdr.currentArticle = nextCanidate;
            }
        } else {
            MblRdr.currentArticle = $('.articlesList li:first');
        }

        if (MblRdr.currentArticle.nextAll(':visible').length < 5) {
            $('.moreLink').trigger('click');
        }
    }

    function findPrevArticle() {
        var prevCandidate;
        if ((typeof MblRdr.currentArticle !== "undefined") && (MblRdr.currentArticle.length > 0)) {
            prevCandidate = MblRdr.currentArticle.prevAll(':visible:first');
            if ((typeof prevCandidate !== "undefined") && (prevCandidate.length > 0)) {
                MblRdr.currentArticle = prevCandidate;
            } else {
                if ((MblRdr.currentArticle.length > 0) && ($('.articlesList li:first').length > 0) &&
                    (MblRdr.currentArticle[0] === $('.articlesList li:first')[0])) {
                    gotoTop();
                    return false;
                }
            }
        } else {
            MblRdr.currentArticle = $('.articlesList li:first');
        }

        return true;
    }

    function openCurrentArticle() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }
        if (MblRdr.currentArticle.find('.content').css('display') === 'none') {
            MblRdr.currentArticle.find('a.title').click();
        } else {
            $('.selectedArticle').removeClass('selectedArticle');
            MblRdr.currentArticle.find('.header').addClass('selectedArticle');
        }

        //$('html, body').animate({
        //    scrollTop: MblRdr.currentArticle.offset().top
        //}, 300);
        //MblRdr.scrollTo($(document).scrollTop() - 200, 1300);
        MblRdr.scrollTo(MblRdr.currentArticle.find('.contentHeader').offset().top, 300);

        //$('html, body').animate({
        //    scrollTop: $(document).scrollTop() - 200
        //}, 300).animate({
        //    scrollTop: MblRdr.currentArticle.find('.contentHeader').offset().top
        //}, 1300);

        // var diff = $(document).scrollTop() > MblRdr.currentArticle.find('.contentHeader').offset().top ? -20: 20;
        // $('html, body').animate({
        //     scrollTop: MblRdr.currentArticle.find('.contentHeader').offset().top + diff
        // }, 300, function() {
        //     $('html, body').animate({
        //         scrollTop: MblRdr.currentArticle.find('.contentHeader').offset().top
        //     }, 300 / 2);
        // });

        // $('#card').css({
        //   'transition': 'transform 1s',
        //   'transform': 'translate3d(687px, 443px, 0px)'
        // }).on('transitionend', function() {
        //   deferred.resolve();
        // });

    }

    function toggleCurrentArticle() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }

        MblRdr.currentArticle.find('a.title').click();
    }

    function moveToCurrentArticle() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }
        if (MblRdr.currentArticle.find('.content').css('display') === 'none') {
            $('.selectedArticle').removeClass('selectedArticle');
            MblRdr.currentArticle.find('.header').addClass('selectedArticle');
        }

        //$('html, body').animate({
        //    scrollTop: MblRdr.currentArticle.offset().top
        //}, 300);
        MblRdr.scrollTo(MblRdr.currentArticle.offset().top, 100)

    }

    function moveToNextArticle() {
        findNextArticle();
        moveToCurrentArticle();
    }

    function moveToPrevArticle() {
        findPrevArticle();
        moveToCurrentArticle();
    }

    function starCurrentArticle() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }

        MblRdr.currentArticle.find('.star').click();
    }

    function openCurrentArticleInNewWindow() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }

        MblRdr.currentArticle.find('.headerUrl').focus();
    }

    function toggleCurrentArticleRead() {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }

        if (MblRdr.currentArticle.find('.unread').length === 0) {
            MblRdr.currentArticle.find('a.title span').addClass('unread');
        } else {
            MblRdr.currentArticle.find('a.title span').removeClass('unread');
        }
    }

    function zoomContent(out) {
        if ((typeof MblRdr.currentArticle === "undefined") || (MblRdr.currentArticle.length === 0)) {
            return;
        }

        var fontSize = parseInt(MblRdr.currentArticle.find('.content:first').css("font-size")),
        lineHeight = parseInt(MblRdr.currentArticle.find('.content:first').css("line-height"));

        if (typeof MblRdr.currentArticle.find('.content:first').data('origfontsize') === "undefined") {
            MblRdr.currentArticle.find('.content:first').data('origfontsize', fontSize);
            MblRdr.currentArticle.find('.content:first').data('origlineheight', lineHeight);
        }

        if (out === -1) {
            fontSize = fontSize - 3 + "px";
            lineHeight = lineHeight  - 3 + "px";
        } else if (out === 1) {
            fontSize = fontSize + 3 + "px";
            lineHeight = lineHeight  + 3 + "px";
        } else if (out === 0) {
            fontSize = MblRdr.currentArticle.find('.content:first').data('origfontsize') + 'px';
            lineHeight = MblRdr.currentArticle.find('.content:first').data('origlineheight') + 'px';
        }

        MblRdr.currentArticle.find('.content:first').css({
            'font-size': fontSize,
            'line-height': lineHeight
        });
    }

    function otherInputHasFocus() {
        return $('input:focus').length > 0;
    }

    function initKeyboardEvents() {
        $('body').off('keydown').on('keydown', function(evt) {

            if (otherInputHasFocus()) {
                return;
            }

            var keyCode;

            evt = evt || window.event;
            keyCode = evt.keyCode;

            if (keyCode === 74) { //j
                openNextArticle();
            } else if (keyCode === 75) { //k
                openPrevArticle();
            } else if (keyCode === 78) { //n
                moveToNextArticle();
            } else if (keyCode === 80) { //p
                moveToPrevArticle();
            } else if ((keyCode === 79) || (keyCode === 13)) { //o, enter
                toggleCurrentArticle();
            } else if (keyCode === 189) { //-
                zoomContent(-1);
            } else if (keyCode === 187) { //=
                zoomContent(1);
            } else if (keyCode === 83) { //s
                starCurrentArticle();
            } else if (keyCode === 86) { //v
                openCurrentArticleInNewWindow();
            } else if (keyCode === 77) { //m
                toggleCurrentArticleRead();
            } else if (keyCode === 191) { //?
            }
        });
    };

    function gotoTop() {
        MblRdr.scrollTo(0, 300);
    }

    function initGestureEvents(el) {
        var options = {
            prevent_default: false, 
            dragBlockHorizontal: true,
            behavior: {
                userSelect: "text"
            }
        }, hammertime = new Hammer($(el.find(".content"))[0], options);

        hammertime.on("doubletap swipeleft swiperight pinchin pinchout", function(ev){ 
            MblRdr.currentArticle = el;

            if (ev.type === "doubletap") {
                openCurrentArticle();
                zoomContent(0);
                ev.gesture.preventDefault(); //ptevent mobile zoomin/zoomout
            } else if (ev.type === "swipeleft") {
                openPrevArticle();
            } else if (ev.type === "swiperight") {
                openNextArticle();
            } else if (ev.type === "pinchin") {
                zoomContent(-1);
                ev.gesture.preventDefault();
                ev.gesture.stopPropagation();
            } else if (ev.type === "pinchout") {
                zoomContent(1);
                ev.gesture.preventDefault();
                ev.gesture.stopPropagation();
            } else {
                alert(ev.type);
            }

        });
        
        return;
    }

    return {
        initKeyboardEvents: initKeyboardEvents,
        initGestureEvents: initGestureEvents,
        openNextArticle: openNextArticle,
        openPrevArticle: openPrevArticle,
        zoomContent: zoomContent,
        gotoTop: gotoTop
    }
}();
