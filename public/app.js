require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    isPreviewDeck = window.location.hash === '#preview';

window.presentation = new presentationModule(document.getElementsByClassName('slide'), document.body.getAttribute('data-presentation'), isPreviewDeck);

document.addEventListener('keydown', function(e) {
    'use strict';
    if (e.keyCode === 37) {
        window.presentation.prev();
    } else if (e.keyCode === 39) {
        window.presentation.next();
    }
});

window.addEventListener('resize', viewportObserver.setRatio);
viewportObserver.setRatio();
},{"./presentation":2,"./viewport-observer":3}],2:[function(require,module,exports){
module.exports = function(slides, name, isPreviewDeck) {
    'use strict';
    var exports = {},
        currentIndex = 0,
        socket;

    function init() {
        if (isPreviewDeck) {
            addEndSlide();
        }
        setSlides();
        socket = io.connect('http://localhost');
        socket.on('goto-slide', function(data){
            exports.goTo(data, true);
        });
        socket.emit('register', {presentation: name});
    }

    exports.next = function() {
        exports.goTo(getNextSlideIndex(currentIndex));
    };

    exports.prev = function() {
        exports.goTo(getPrevSlideIndex(currentIndex));
    };

    exports.goTo = function(slideIndex, remoteInvoked) {
        if (slides.length > slideIndex) {
            if (!remoteInvoked) {
                socket.emit('goto-slide', {presentationName: name, slide: slideIndex});
            }
            currentIndex = slideIndex;
            setSlides();
        }
    };

    function addEndSlide() {
        var article = document.createElement('article');
        article.classList.add('slide', 'end');
        slides[slides.length-1].parentNode.insertBefore(article, slides[slides.length-1].nextSibling);
    }

    function setSlides() {
        var currentIndexLocal = isPreviewDeck ? (currentIndex + 1) : currentIndex;
        for (var i = slides.length - 1; i >= 0; i--) {
            slides[i].classList.remove('current', 'next', 'prev', 'next-next', 'prev-prev');
        }
        slides[currentIndexLocal].classList.add('current');
        var nextIndex = getNextSlideIndex(currentIndexLocal),
            prevIndex = getPrevSlideIndex(currentIndexLocal);
        if (nextIndex !== currentIndexLocal) {
            slides[nextIndex].classList.add('next');
            var nextNextIndex = getNextSlideIndex(nextIndex);
            if (nextNextIndex !== nextIndex) {
                slides[nextNextIndex].classList.add('next-next');
            }
        }
        if (prevIndex !== currentIndexLocal) {
            slides[prevIndex].classList.add('prev');
            var prevPrevIndex = getPrevSlideIndex(prevIndex);
            if (prevPrevIndex !== prevIndex) {
                slides[prevPrevIndex].classList.add('prev-prev');
            }
        }
    }

    function getNextSlideIndex(currentSlideIndex) {
        if (currentSlideIndex + 1 >= slides.length) {
            return slides.length - 1;
        } else {
            return currentSlideIndex + 1;
        }
    }

    function getPrevSlideIndex(currentSlideIndex) {
        if (currentSlideIndex <= 0) {
            return 0;
        } else {
            return currentSlideIndex - 1;
        }
    }

    init();

    return exports;
};
},{}],3:[function(require,module,exports){
var presentations = [];

exports.registerPresentation = function(presentation) {
    presentations.add(presentation);
};

exports.setRatio = function() {
    var width,
        height,
        aspectRatio = 4/3;
    if (window.innerWidth > window.innerHeight) {
        width = window.innerHeight * aspectRatio;
        height = window.innerHeight;
    } else {
        height = window.innerWidth * aspectRatio;
        width = window.innerWidth;
    }
    document.getElementById('slide-container').style.width = width + 'px';
    document.getElementById('slide-container').style.height = height + 'px';
    document.body.style.fontSize = (height * 0.002) + 'em';
};
},{}],"RklVba":[function(require,module,exports){
(function (global){
(function browserifyShim(module, exports, define, browserify_shim__define__module__export__) {
!(function(moduleName, definition) {
  // Whether to expose Draggable as an AMD module or to the global object.
  if (typeof define === 'function' && typeof define.amd === 'object') define(definition);
  else this[moduleName] = definition();

})('draggable', function definition() {
  var currentElement;
  var fairlyHighZIndex = '10';

  function draggable(element, handle) {
    handle = handle || element;
    setPositionType(element);
    setDraggableListeners(element);
    handle.addEventListener('mousedown', function(event) {
      startDragging(event, element);
    });
  }

  function setPositionType(element) {
    element.style.position = 'absolute';
  }

  function setDraggableListeners(element) {
    element.draggableListeners = {
      start: [],
      drag: [],
      stop: []
    };
    element.whenDragStarts = addListener(element, 'start');
    element.whenDragging = addListener(element, 'drag');
    element.whenDragStops = addListener(element, 'stop');
  }

  function startDragging(event, element) {
    currentElement && sendToBack(currentElement);
    currentElement = bringToFront(element);


    var initialPosition = getInitialPosition(currentElement);
    currentElement.style.left = inPixels(initialPosition.left);
    currentElement.style.top = inPixels(initialPosition.top);
    currentElement.lastXPosition = event.clientX;
    currentElement.lastYPosition = event.clientY;

    var okToGoOn = triggerEvent('start', { x: initialPosition.left, y: initialPosition.top, mouseEvent: event });
    if (!okToGoOn) return;

    addDocumentListeners();
  }

  function addListener(element, type) {
    return function(listener) {
      element.draggableListeners[type].push(listener);
    };
  }

  function triggerEvent(type, args) {
    var result = true;
    var listeners = currentElement.draggableListeners[type];
    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i](args) === false) result = false;
    };
    return result;
  }

  function sendToBack(element) {
    var decreasedZIndex = fairlyHighZIndex - 1;
    element.style['z-index'] = decreasedZIndex;
    element.style['zIndex'] = decreasedZIndex;
  }

  function bringToFront(element) {
    element.style['z-index'] = fairlyHighZIndex;
    element.style['zIndex'] = fairlyHighZIndex;
    return element;
  }

  function addDocumentListeners() {
    document.addEventListener('selectstart', cancelDocumentSelection);
    document.addEventListener('mousemove', repositionElement);
    document.addEventListener('mouseup', removeDocumentListeners);
  }

  function getInitialPosition(element) {
    var top = 0;
    var left = 0;
    var currentElement = element;
    do {
      top += currentElement.offsetTop;
      left += currentElement.offsetLeft;
    } while (currentElement = currentElement.offsetParent);

    var computedStyle = getComputedStyle? getComputedStyle(element) : false;
    if (computedStyle) {
      left = left - (parseInt(computedStyle['margin-left']) || 0) - (parseInt(computedStyle['border-left']) || 0);
      top = top - (parseInt(computedStyle['margin-top']) || 0) - (parseInt(computedStyle['border-top']) || 0);
    }

    return {
      top: top,
      left: left
    };
  }

  function inPixels(value) {
    return value + 'px';
  }

  function cancelDocumentSelection(event) {
    event.preventDefault && event.preventDefault();
    event.stopPropagation && event.stopPropagation();
    event.returnValue = false;
    return false;
  }

  function repositionElement(event) {
    var style = currentElement.style;
    var elementXPosition = parseInt(style.left, 10);
    var elementYPosition = parseInt(style.top, 10);

    var elementNewXPosition = elementXPosition + (event.clientX - currentElement.lastXPosition);
    var elementNewYPosition = elementYPosition + (event.clientY - currentElement.lastYPosition);

    style.left = inPixels(elementNewXPosition);
    style.top = inPixels(elementNewYPosition);

    currentElement.lastXPosition = event.clientX;
    currentElement.lastYPosition = event.clientY;

    triggerEvent('drag', { x: elementNewXPosition, y: elementNewYPosition, mouseEvent: event });
  }

  function removeDocumentListeners(event) {
    document.removeEventListener('selectstart', cancelDocumentSelection);
    document.removeEventListener('mousemove', repositionElement);
    document.removeEventListener('mouseup', removeDocumentListeners);

    var left = parseInt(currentElement.style.left, 10);
    var top = parseInt(currentElement.style.top, 10);
    triggerEvent('stop', { x: left, y: top, mouseEvent: event });
  }

  return draggable;
});
; browserify_shim__define__module__export__(typeof draggable != "undefined" ? draggable : window.draggable);

}).call(global, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"draggable":[function(require,module,exports){
module.exports=require('RklVba');
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jb21wb25lbnRzL2RyYWdnYWJsZS9kcmFnZ2FibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpLFxuICAgIGlzUHJldmlld0RlY2sgPSB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gJyNwcmV2aWV3Jztcblxud2luZG93LnByZXNlbnRhdGlvbiA9IG5ldyBwcmVzZW50YXRpb25Nb2R1bGUoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGUnKSwgZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJlc2VudGF0aW9uJyksIGlzUHJldmlld0RlY2spO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAoZS5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB2aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKTtcbnZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNsaWRlcywgbmFtZSwgaXNQcmV2aWV3RGVjaykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBjdXJyZW50SW5kZXggPSAwLFxuICAgICAgICBzb2NrZXQ7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBpZiAoaXNQcmV2aWV3RGVjaykge1xuICAgICAgICAgICAgYWRkRW5kU2xpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgc29ja2V0ID0gaW8uY29ubmVjdCgnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICBzb2NrZXQub24oJ2dvdG8tc2xpZGUnLCBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIGV4cG9ydHMuZ29UbyhkYXRhLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNvY2tldC5lbWl0KCdyZWdpc3RlcicsIHtwcmVzZW50YXRpb246IG5hbWV9KTtcbiAgICB9XG5cbiAgICBleHBvcnRzLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnByZXYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdvVG8gPSBmdW5jdGlvbihzbGlkZUluZGV4LCByZW1vdGVJbnZva2VkKSB7XG4gICAgICAgIGlmIChzbGlkZXMubGVuZ3RoID4gc2xpZGVJbmRleCkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdGVJbnZva2VkKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ2dvdG8tc2xpZGUnLCB7cHJlc2VudGF0aW9uTmFtZTogbmFtZSwgc2xpZGU6IHNsaWRlSW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlSW5kZXg7XG4gICAgICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhZGRFbmRTbGlkZSgpIHtcbiAgICAgICAgdmFyIGFydGljbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhcnRpY2xlJyk7XG4gICAgICAgIGFydGljbGUuY2xhc3NMaXN0LmFkZCgnc2xpZGUnLCAnZW5kJyk7XG4gICAgICAgIHNsaWRlc1tzbGlkZXMubGVuZ3RoLTFdLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGFydGljbGUsIHNsaWRlc1tzbGlkZXMubGVuZ3RoLTFdLm5leHRTaWJsaW5nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRTbGlkZXMoKSB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXhMb2NhbCA9IGlzUHJldmlld0RlY2sgPyAoY3VycmVudEluZGV4ICsgMSkgOiBjdXJyZW50SW5kZXg7XG4gICAgICAgIGZvciAodmFyIGkgPSBzbGlkZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHNsaWRlc1tpXS5jbGFzc0xpc3QucmVtb3ZlKCdjdXJyZW50JywgJ25leHQnLCAncHJldicsICduZXh0LW5leHQnLCAncHJldi1wcmV2Jyk7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVzW2N1cnJlbnRJbmRleExvY2FsXS5jbGFzc0xpc3QuYWRkKCdjdXJyZW50Jyk7XG4gICAgICAgIHZhciBuZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXhMb2NhbCksXG4gICAgICAgICAgICBwcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXhMb2NhbCk7XG4gICAgICAgIGlmIChuZXh0SW5kZXggIT09IGN1cnJlbnRJbmRleExvY2FsKSB7XG4gICAgICAgICAgICBzbGlkZXNbbmV4dEluZGV4XS5jbGFzc0xpc3QuYWRkKCduZXh0Jyk7XG4gICAgICAgICAgICB2YXIgbmV4dE5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KG5leHRJbmRleCk7XG4gICAgICAgICAgICBpZiAobmV4dE5leHRJbmRleCAhPT0gbmV4dEluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW25leHROZXh0SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ25leHQtbmV4dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2SW5kZXggIT09IGN1cnJlbnRJbmRleExvY2FsKSB7XG4gICAgICAgICAgICBzbGlkZXNbcHJldkluZGV4XS5jbGFzc0xpc3QuYWRkKCdwcmV2Jyk7XG4gICAgICAgICAgICB2YXIgcHJldlByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KHByZXZJbmRleCk7XG4gICAgICAgICAgICBpZiAocHJldlByZXZJbmRleCAhPT0gcHJldkluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW3ByZXZQcmV2SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ3ByZXYtcHJldicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4ICsgMSA+PSBzbGlkZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2xpZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4IDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJ2YXIgcHJlc2VudGF0aW9ucyA9IFtdO1xuXG5leHBvcnRzLnJlZ2lzdGVyUHJlc2VudGF0aW9uID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgcHJlc2VudGF0aW9ucy5hZGQocHJlc2VudGF0aW9uKTtcbn07XG5cbmV4cG9ydHMuc2V0UmF0aW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgYXNwZWN0UmF0aW8gPSA0LzM7XG4gICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVySGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIH1cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5mb250U2l6ZSA9IChoZWlnaHQgKiAwLjAwMikgKyAnZW0nO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4oZnVuY3Rpb24gYnJvd3NlcmlmeVNoaW0obW9kdWxlLCBleHBvcnRzLCBkZWZpbmUsIGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKSB7XG4hKGZ1bmN0aW9uKG1vZHVsZU5hbWUsIGRlZmluaXRpb24pIHtcbiAgLy8gV2hldGhlciB0byBleHBvc2UgRHJhZ2dhYmxlIGFzIGFuIEFNRCBtb2R1bGUgb3IgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pO1xuICBlbHNlIHRoaXNbbW9kdWxlTmFtZV0gPSBkZWZpbml0aW9uKCk7XG5cbn0pKCdkcmFnZ2FibGUnLCBmdW5jdGlvbiBkZWZpbml0aW9uKCkge1xuICB2YXIgY3VycmVudEVsZW1lbnQ7XG4gIHZhciBmYWlybHlIaWdoWkluZGV4ID0gJzEwJztcblxuICBmdW5jdGlvbiBkcmFnZ2FibGUoZWxlbWVudCwgaGFuZGxlKSB7XG4gICAgaGFuZGxlID0gaGFuZGxlIHx8IGVsZW1lbnQ7XG4gICAgc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpO1xuICAgIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHN0YXJ0RHJhZ2dpbmcoZXZlbnQsIGVsZW1lbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnMgPSB7XG4gICAgICBzdGFydDogW10sXG4gICAgICBkcmFnOiBbXSxcbiAgICAgIHN0b3A6IFtdXG4gICAgfTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RhcnRzID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ3N0YXJ0Jyk7XG4gICAgZWxlbWVudC53aGVuRHJhZ2dpbmcgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnZHJhZycpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdTdG9wcyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdG9wJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KSB7XG4gICAgY3VycmVudEVsZW1lbnQgJiYgc2VuZFRvQmFjayhjdXJyZW50RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQgPSBicmluZ1RvRnJvbnQoZWxlbWVudCk7XG5cblxuICAgIHZhciBpbml0aWFsUG9zaXRpb24gPSBnZXRJbml0aWFsUG9zaXRpb24oY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLmxlZnQgPSBpblBpeGVscyhpbml0aWFsUG9zaXRpb24ubGVmdCk7XG4gICAgY3VycmVudEVsZW1lbnQuc3R5bGUudG9wID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLnRvcCk7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB2YXIgb2tUb0dvT24gPSB0cmlnZ2VyRXZlbnQoJ3N0YXJ0JywgeyB4OiBpbml0aWFsUG9zaXRpb24ubGVmdCwgeTogaW5pdGlhbFBvc2l0aW9uLnRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gICAgaWYgKCFva1RvR29PbikgcmV0dXJuO1xuXG4gICAgYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGVsZW1lbnQsIHR5cGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQodHlwZSwgYXJncykge1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBjdXJyZW50RWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnNbdHlwZV07XG4gICAgZm9yICh2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXShhcmdzKSA9PT0gZmFsc2UpIHJlc3VsdCA9IGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRUb0JhY2soZWxlbWVudCkge1xuICAgIHZhciBkZWNyZWFzZWRaSW5kZXggPSBmYWlybHlIaWdoWkluZGV4IC0gMTtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiBicmluZ1RvRnJvbnQoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGVbJ3otaW5kZXgnXSA9IGZhaXJseUhpZ2haSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbik7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVwb3NpdGlvbkVsZW1lbnQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCByZW1vdmVEb2N1bWVudExpc3RlbmVycyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJbml0aWFsUG9zaXRpb24oZWxlbWVudCkge1xuICAgIHZhciB0b3AgPSAwO1xuICAgIHZhciBsZWZ0ID0gMDtcbiAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGRvIHtcbiAgICAgIHRvcCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICBsZWZ0ICs9IGN1cnJlbnRFbGVtZW50Lm9mZnNldExlZnQ7XG4gICAgfSB3aGlsZSAoY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5vZmZzZXRQYXJlbnQpO1xuXG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlPyBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIDogZmFsc2U7XG4gICAgaWYgKGNvbXB1dGVkU3R5bGUpIHtcbiAgICAgIGxlZnQgPSBsZWZ0IC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi1sZWZ0J10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci1sZWZ0J10pIHx8IDApO1xuICAgICAgdG9wID0gdG9wIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi10b3AnXSkgfHwgMCkgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnYm9yZGVyLXRvcCddKSB8fCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiB0b3AsXG4gICAgICBsZWZ0OiBsZWZ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluUGl4ZWxzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICsgJ3B4JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQgJiYgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gJiYgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZXBvc2l0aW9uRWxlbWVudChldmVudCkge1xuICAgIHZhciBzdHlsZSA9IGN1cnJlbnRFbGVtZW50LnN0eWxlO1xuICAgIHZhciBlbGVtZW50WFBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciBlbGVtZW50WVBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUudG9wLCAxMCk7XG5cbiAgICB2YXIgZWxlbWVudE5ld1hQb3NpdGlvbiA9IGVsZW1lbnRYUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WCAtIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24pO1xuICAgIHZhciBlbGVtZW50TmV3WVBvc2l0aW9uID0gZWxlbWVudFlQb3NpdGlvbiArIChldmVudC5jbGllbnRZIC0gY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbik7XG5cbiAgICBzdHlsZS5sZWZ0ID0gaW5QaXhlbHMoZWxlbWVudE5ld1hQb3NpdGlvbik7XG4gICAgc3R5bGUudG9wID0gaW5QaXhlbHMoZWxlbWVudE5ld1lQb3NpdGlvbik7XG5cbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uID0gZXZlbnQuY2xpZW50WDtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uID0gZXZlbnQuY2xpZW50WTtcblxuICAgIHRyaWdnZXJFdmVudCgnZHJhZycsIHsgeDogZWxlbWVudE5ld1hQb3NpdGlvbiwgeTogZWxlbWVudE5ld1lQb3NpdGlvbiwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVEb2N1bWVudExpc3RlbmVycyhldmVudCkge1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuXG4gICAgdmFyIGxlZnQgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0LCAxMCk7XG4gICAgdmFyIHRvcCA9IHBhcnNlSW50KGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCwgMTApO1xuICAgIHRyaWdnZXJFdmVudCgnc3RvcCcsIHsgeDogbGVmdCwgeTogdG9wLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgfVxuXG4gIHJldHVybiBkcmFnZ2FibGU7XG59KTtcbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIGRyYWdnYWJsZSAhPSBcInVuZGVmaW5lZFwiID8gZHJhZ2dhYmxlIDogd2luZG93LmRyYWdnYWJsZSk7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
