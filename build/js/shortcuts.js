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

        function drawLoader() {
            //setTimeout(function() {
                if (pos < screenWidth){
                    window.requestAnimationFrame(drawLoader);
                } else {
                    drawLoaderEnd();
                    loaderDrawn = true;
                    pos = 0;
                    if (typeof onLoaderDrawn === "function") {
                        drawLoaderEnd();
                        onLoaderDrawn.call();
                        onLoaderDrawn = null;

                    }

                    return;
                }

                pos += 1 + pos / 5;

                var moveRight = (-1 * screenWidth) + pos;

                $progress.css({
                   transform: "translate3d(" + moveRight + "px, 0, 0)"
                });

            //}, 1000 / 60);
        }

        function drawLoaderEnd() {
            $progress.css({
               transform: "translate3d(" + ((-1) * screenWidth) + "px, 0, 0)"
            });
        }

        var options = {
            prevent_default: false, 
            dragBlockHorizontal: false,
            behavior: {
                userSelect: "text"
            },
            velocity: 0.1
        }, $progress = $('#progress'), pos = 0, screenWidth = window.innerWidth;

        if (hammertime) {
            hammertime.destroy();
        }

        hammertime = new Hammer( document.body );
        hammertime.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        //hammertime.add(new Hammer.Pinch());

        var showLoader = false, loaderDrawn = false, drawInProgress = false, onLoaderDrawn;

        hammertime.on('panmove', function(e){
            if (showLoader) {
                if (!drawInProgress) {
                    drawInProgress = true;
                    drawLoader($progress);
                }
            } else {
                if ((e.deltaX > 100) || (e.deltaX < -100)) {
                    showLoader = true;
                    if ($progress.length === 0) {
                        $progress = $('<div id="progress" style="position: fixed; z-index: 1; top: 0px; height: 2px;background: red; width:' + screenWidth + 'px;transform: "translate3d("-' + screenWidth + '"px, 0, 0)"/>').insertBefore('.articlesHeader');;
                    }
                }
            }
        });

        hammertime.on('panend', function(e){
                    if (e.deltaX > 100) {
                        drawLoaderEnd();
                        openNextArticle();
                    } else if (e.deltaX < -100) {
                        drawLoaderEnd();
                        openPrevArticle();
                    }
            // if ((e.deltaX > 100) || (e.deltaX < -100)) {
            //     if (loaderDrawn) {
            //         if (e.deltaX > 100) {
            //             drawLoaderEnd();
            //             openNextArticle();
            //         } else if (e.deltaX < -100) {
            //             drawLoaderEnd();
            //             openPrevArticle();
            //         }
            //     } else {
            //         if (e.deltaX > 100) {
            //             onLoaderDrawn = openNextArticle;
            //         } else if (e.deltaX < -100) {
            //             onLoaderDrawn = openPrevArticle;
            //         }
            //     }
            // }
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
        initGestureEvents2: initGestureEvents2,
        openNextArticle: openNextArticle,
        openPrevArticle: openPrevArticle,
        zoomContent: zoomContent,
        gotoTop: gotoTop
    }
}();


var overscroll = function(el) {
  el.addEventListener('touchstart', function() {
    var top = el.scrollTop, totalScroll = el.scrollHeight, currentScroll = top + el.offsetHeight;

    // If we're at the top or the bottom of the containers
    // scroll, push up or down one pixel. 
    // This prevents the scroll from "passing through" tothe body.
    
    if(top === 0) {
      el.scrollTop = 1
    } else if(currentScroll === totalScroll) {
      el.scrollTop = top - 1
    }
  })

  el.addEventListener('touchmove', function(evt) {
    //if the content is actually scrollable, i.e. the content is long enough
    //that scrolling can occur
    if(el.offsetHeight < el.scrollHeight)
      evt._isScroller = true
  })
}

overscroll(document.querySelector('body'));

document.body.addEventListener('touchmove', function(evt) {
  //In this case, the default behavior is scrolling the body, which
  //would result in an overflow.  Since we don't want that, we preventDefault.
  if(!evt._isScroller) {
    evt.preventDefault();
    alert('no overflow for you');
  }
})
