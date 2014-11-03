;

MblRdr.shortcuts = function() {
    "use strict";

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
        var $progress = $('#progress'), pos = 0, screenWidth = window.innerWidth;

        function drawLoader() {
            var moveRight;
            setTimeout(function() {
                if (pos < screenWidth){
                    window.requestAnimationFrame(drawLoader);
                } else {
                    pos = 0;
                    $progress.css({
                       transform: "translate3d(" + ((-1) * screenWidth) + "px, 0, 0)"
                    });
                    return;
                }

                pos += 1 + pos / 5;
                moveRight = (-1 * screenWidth) + pos;
                $progress.css({
                   transform: "translate3d(" + moveRight + "px, 0, 0)"
                });
            }, 500 / 60);
        }

        if (hammertime) {
            hammertime.destroy();
        }

        hammertime = new Hammer( document.body );
        hammertime.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL }));
        hammertime.on('panend', function(e) {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                if ($progress.length === 0) {
                    $progress = $('<div id="progress" style="position: fixed; z-index: 1; top: 0px; height: 2px;background: red; width:' + screenWidth + 'px;transform: "translate3d("-' + screenWidth + '"px, 0, 0)"/>').insertBefore('body');
                }
                drawLoader($progress);

                if (e.deltaX > 100) {
                    openNextArticle();
                } else if (e.deltaX < -100) {
                    openPrevArticle();
                }
            }
        });
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


//todo move these out of here
// optimizations
var overscroll = function(el) {
  el.addEventListener('touchstart', function() {
    var top = el.scrollTop, totalScroll = el.scrollHeight, currentScroll = top + el.offsetHeight;

    if(top === 0) {
      el.scrollTop = 1
    } else if(currentScroll === totalScroll) {
      el.scrollTop = top - 1
    }
  })

  el.addEventListener('touchmove', function(evt) {
    if(el.offsetHeight < el.scrollHeight)
      evt._isScroller = true
  })
}

overscroll(document.querySelector('body'));

document.body.addEventListener('touchmove', function(evt) {
  if(!evt._isScroller) {
    evt.preventDefault();
  }
})


//polyfills
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
