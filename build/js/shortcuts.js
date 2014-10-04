;

MblRdr.shortcuts = function() {
    "use strict";

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;

    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                       || window[vendors[x]+'CancelRequestAnimationFrame'];
        }
     
        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
     
        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    function openNextArticle() {
        setCurrentArticle();
        openCurrentArticle();
    }

    function openPrevArticle() {
        if (findPrevArticle()) {
            openCurrentArticle();
        };
    }

    function setCurrentArticle() {
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
            MblRdr.openArticle(MblRdr.currentArticle);
        }

        MblRdr.scrollTo(MblRdr.currentArticle.find('.contentHeader').offset().top, 300);
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

        MblRdr.scrollTo(MblRdr.currentArticle.offset().top, 100)
    }

    function moveToNextArticle() {
        setCurrentArticle();
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

    var hammertime;

    function initGestureEvents2() {
        var options = {
            prevent_default: false, 
            dragBlockHorizontal: false,
            behavior: {
                userSelect: "text"
            },
            velocity: 0.1
        };

        if (hammertime) {
            hammertime.destroy();
        }

        hammertime = new Hammer( document.body );
        hammertime.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        hammertime.add(new Hammer.Pinch());

        hammertime.on('panmove', function(e){
            MblRdr.currentArticle.css({
                position: 'relative', 
                transform: "translate3d("+ Math.round(e.deltaX) + "px, 0, 0)"
            });
        });

        hammertime.on('panend', function(e){
            var article = MblRdr.currentArticle;

            article.css({
                position: 'relative', 
                transform: "translate3d(10000, 0, 0)"
            });

            hammertime.destroy();

            if (e.deltaX > 100) {
                openNextArticle();
            } else if (e.deltaX < -100) {
                openPrevArticle();
            }

            article.css({
                position: 'relative', 
                transform: "translate3d(0, 0, 0)"
            });
        });
    }

    function initGestureEvents(el) {
        alert('wtf');
        var options = {
            prevent_default: false, 
            dragBlockHorizontal: true,
            behavior: {
                userSelect: "text"
            },
            velocity: 0.1
        };




        // if ($progress.length === 0) {
        //     $progress = $('<div id="progress" style="position: fixed; top: 0px; height: 2px;background: red; width: 0%;"/>').insertBefore('.articlesHeader');;
        // }

        // function step (){
        //     var div = document.getElementById("progress");
        //     if (div.style.width != "100%"){
        //         div.style.width = (parseInt(div.style.width, 10) + 5) + "%";
        //         requestAnimationFrame(step);
        //     }
        // }

        // var pos = 0;

        // function draw() {
        //     setTimeout(function() {
        //         if (pos < 100){
        //             window.requestAnimationFrame(draw);
        //         } else {
        //             $progress.css('width', '0px');
        //             dragging = false;
        //             pos = 0;
        //             return;
        //         }

        //         pos += 1 + pos / 6;
        //         $progress.css('width', pos + '%');

        //     }, 1000 / 60);
        // }
        

        hammertime.on("swipeleft swiperight pinchin pinchout", function(ev){ 
            var oldCurrentArticle = MblRdr.currentArticle;

            MblRdr.currentArticle = el;

            if (ev.type === "doubletap") {
                openCurrentArticle();
                zoomContent(0);
                ev.preventDefault(); //ptevent mobile zoomin/zoomout
            } else if (ev.type === "swipeleft") {
                openPrevArticle();
            } else if (ev.type === "swiperight") {
                openNextArticle();
            } else if (ev.type === "pinchin") {
                zoomContent(-1);
                ev.preventDefault();
            } else if (ev.type === "pinchout") {
                zoomContent(1);
                ev.preventDefault();
            } else {
                console.log(ev.type);
            }

            oldCurrentArticle.css({
                left: '0px'
            });
        });
        
        return;
    }

    return {
        initKeyboardEvents: initKeyboardEvents,
        initGestureEvents: initGestureEvents2,
        openNextArticle: openNextArticle,
        openPrevArticle: openPrevArticle,
        zoomContent: zoomContent,
        gotoTop: gotoTop
    }
}();
