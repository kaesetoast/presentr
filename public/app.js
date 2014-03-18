require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer');

window.presentation = new presentationModule(document.getElementsByClassName('slide'), document.body.getAttribute('data-presentation'));

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
module.exports = function(slides, name) {
    'use strict';
    var exports = {},
        currentIndex = 0,
        socket;

    function init() {
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

    function setSlides() {
        for (var i = slides.length - 1; i >= 0; i--) {
            slides[i].classList.remove('current', 'next', 'prev', 'next-next', 'prev-prev');
        }
        slides[currentIndex].classList.add('current');
        var nextIndex = getNextSlideIndex(currentIndex),
            prevIndex = getPrevSlideIndex(currentIndex);
        if (nextIndex !== currentIndex) {
            slides[nextIndex].classList.add('next');
            var nextNextIndex = getNextSlideIndex(nextIndex);
            if (nextNextIndex !== nextIndex) {
                slides[nextNextIndex].classList.add('next-next');
            }
        }
        if (prevIndex !== currentIndex) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jb21wb25lbnRzL2RyYWdnYWJsZS9kcmFnZ2FibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHByZXNlbnRhdGlvbk1vZHVsZSA9IHJlcXVpcmUoJy4vcHJlc2VudGF0aW9uJyksXG4gICAgdmlld3BvcnRPYnNlcnZlciA9IHJlcXVpcmUoJy4vdmlld3BvcnQtb2JzZXJ2ZXInKTtcblxud2luZG93LnByZXNlbnRhdGlvbiA9IG5ldyBwcmVzZW50YXRpb25Nb2R1bGUoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGUnKSwgZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJlc2VudGF0aW9uJykpO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAoZS5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB2aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKTtcbnZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNsaWRlcywgbmFtZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBjdXJyZW50SW5kZXggPSAwLFxuICAgICAgICBzb2NrZXQ7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgc29ja2V0ID0gaW8uY29ubmVjdCgnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICBzb2NrZXQub24oJ2dvdG8tc2xpZGUnLCBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIGV4cG9ydHMuZ29UbyhkYXRhLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNvY2tldC5lbWl0KCdyZWdpc3RlcicsIHtwcmVzZW50YXRpb246IG5hbWV9KTtcbiAgICB9XG5cbiAgICBleHBvcnRzLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnByZXYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdvVG8gPSBmdW5jdGlvbihzbGlkZUluZGV4LCByZW1vdGVJbnZva2VkKSB7XG4gICAgICAgIGlmIChzbGlkZXMubGVuZ3RoID4gc2xpZGVJbmRleCkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdGVJbnZva2VkKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ2dvdG8tc2xpZGUnLCB7cHJlc2VudGF0aW9uTmFtZTogbmFtZSwgc2xpZGU6IHNsaWRlSW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlSW5kZXg7XG4gICAgICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzZXRTbGlkZXMoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBzbGlkZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHNsaWRlc1tpXS5jbGFzc0xpc3QucmVtb3ZlKCdjdXJyZW50JywgJ25leHQnLCAncHJldicsICduZXh0LW5leHQnLCAncHJldi1wcmV2Jyk7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVzW2N1cnJlbnRJbmRleF0uY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpO1xuICAgICAgICB2YXIgbmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4KSxcbiAgICAgICAgICAgIHByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleCk7XG4gICAgICAgIGlmIChuZXh0SW5kZXggIT09IGN1cnJlbnRJbmRleCkge1xuICAgICAgICAgICAgc2xpZGVzW25leHRJbmRleF0uY2xhc3NMaXN0LmFkZCgnbmV4dCcpO1xuICAgICAgICAgICAgdmFyIG5leHROZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChuZXh0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHROZXh0SW5kZXggIT09IG5leHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1tuZXh0TmV4dEluZGV4XS5jbGFzc0xpc3QuYWRkKCduZXh0LW5leHQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldkluZGV4ICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgICAgIHNsaWRlc1twcmV2SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ3ByZXYnKTtcbiAgICAgICAgICAgIHZhciBwcmV2UHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgocHJldkluZGV4KTtcbiAgICAgICAgICAgIGlmIChwcmV2UHJldkluZGV4ICE9PSBwcmV2SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbcHJldlByZXZJbmRleF0uY2xhc3NMaXN0LmFkZCgncHJldi1wcmV2Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggKyAxID49IHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzbGlkZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsInZhciBwcmVzZW50YXRpb25zID0gW107XG5cbmV4cG9ydHMucmVnaXN0ZXJQcmVzZW50YXRpb24gPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICBwcmVzZW50YXRpb25zLmFkZChwcmVzZW50YXRpb24pO1xufTtcblxuZXhwb3J0cy5zZXRSYXRpbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICBhc3BlY3RSYXRpbyA9IDQvMztcbiAgICBpZiAod2luZG93LmlubmVyV2lkdGggPiB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoICogYXNwZWN0UmF0aW87XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgfVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmZvbnRTaXplID0gKGhlaWdodCAqIDAuMDAyKSArICdlbSc7XG59OyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbihmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbiEoZnVuY3Rpb24obW9kdWxlTmFtZSwgZGVmaW5pdGlvbikge1xuICAvLyBXaGV0aGVyIHRvIGV4cG9zZSBEcmFnZ2FibGUgYXMgYW4gQU1EIG1vZHVsZSBvciB0byB0aGUgZ2xvYmFsIG9iamVjdC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnKSBkZWZpbmUoZGVmaW5pdGlvbik7XG4gIGVsc2UgdGhpc1ttb2R1bGVOYW1lXSA9IGRlZmluaXRpb24oKTtcblxufSkoJ2RyYWdnYWJsZScsIGZ1bmN0aW9uIGRlZmluaXRpb24oKSB7XG4gIHZhciBjdXJyZW50RWxlbWVudDtcbiAgdmFyIGZhaXJseUhpZ2haSW5kZXggPSAnMTAnO1xuXG4gIGZ1bmN0aW9uIGRyYWdnYWJsZShlbGVtZW50LCBoYW5kbGUpIHtcbiAgICBoYW5kbGUgPSBoYW5kbGUgfHwgZWxlbWVudDtcbiAgICBzZXRQb3NpdGlvblR5cGUoZWxlbWVudCk7XG4gICAgc2V0RHJhZ2dhYmxlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRQb3NpdGlvblR5cGUoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RHJhZ2dhYmxlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVycyA9IHtcbiAgICAgIHN0YXJ0OiBbXSxcbiAgICAgIGRyYWc6IFtdLFxuICAgICAgc3RvcDogW11cbiAgICB9O1xuICAgIGVsZW1lbnQud2hlbkRyYWdTdGFydHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RhcnQnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnZ2luZyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdkcmFnJyk7XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0b3BzID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ3N0b3AnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0YXJ0RHJhZ2dpbmcoZXZlbnQsIGVsZW1lbnQpIHtcbiAgICBjdXJyZW50RWxlbWVudCAmJiBzZW5kVG9CYWNrKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudCA9IGJyaW5nVG9Gcm9udChlbGVtZW50KTtcblxuXG4gICAgdmFyIGluaXRpYWxQb3NpdGlvbiA9IGdldEluaXRpYWxQb3NpdGlvbihjdXJyZW50RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi5sZWZ0KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS50b3AgPSBpblBpeGVscyhpbml0aWFsUG9zaXRpb24udG9wKTtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uID0gZXZlbnQuY2xpZW50WDtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uID0gZXZlbnQuY2xpZW50WTtcblxuICAgIHZhciBva1RvR29PbiA9IHRyaWdnZXJFdmVudCgnc3RhcnQnLCB7IHg6IGluaXRpYWxQb3NpdGlvbi5sZWZ0LCB5OiBpbml0aWFsUG9zaXRpb24udG9wLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgICBpZiAoIW9rVG9Hb09uKSByZXR1cm47XG5cbiAgICBhZGREb2N1bWVudExpc3RlbmVycygpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZWxlbWVudCwgdHlwZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgZWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFdmVudCh0eXBlLCBhcmdzKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgdmFyIGxpc3RlbmVycyA9IGN1cnJlbnRFbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXTtcbiAgICBmb3IgKHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldKGFyZ3MpID09PSBmYWxzZSkgcmVzdWx0ID0gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZFRvQmFjayhlbGVtZW50KSB7XG4gICAgdmFyIGRlY3JlYXNlZFpJbmRleCA9IGZhaXJseUhpZ2haSW5kZXggLSAxO1xuICAgIGVsZW1lbnQuc3R5bGVbJ3otaW5kZXgnXSA9IGRlY3JlYXNlZFpJbmRleDtcbiAgICBlbGVtZW50LnN0eWxlWyd6SW5kZXgnXSA9IGRlY3JlYXNlZFpJbmRleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJyaW5nVG9Gcm9udChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICBlbGVtZW50LnN0eWxlWyd6SW5kZXgnXSA9IGZhaXJseUhpZ2haSW5kZXg7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBhZGREb2N1bWVudExpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEluaXRpYWxQb3NpdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIHRvcCA9IDA7XG4gICAgdmFyIGxlZnQgPSAwO1xuICAgIHZhciBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgZG8ge1xuICAgICAgdG9wICs9IGN1cnJlbnRFbGVtZW50Lm9mZnNldFRvcDtcbiAgICAgIGxlZnQgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0TGVmdDtcbiAgICB9IHdoaWxlIChjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50Lm9mZnNldFBhcmVudCk7XG5cbiAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGU/IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkgOiBmYWxzZTtcbiAgICBpZiAoY29tcHV0ZWRTdHlsZSkge1xuICAgICAgbGVmdCA9IGxlZnQgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnbWFyZ2luLWxlZnQnXSkgfHwgMCkgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnYm9yZGVyLWxlZnQnXSkgfHwgMCk7XG4gICAgICB0b3AgPSB0b3AgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnbWFyZ2luLXRvcCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItdG9wJ10pIHx8IDApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGxlZnQ6IGxlZnRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaW5QaXhlbHModmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgKyAncHgnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCAmJiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiAmJiBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcG9zaXRpb25FbGVtZW50KGV2ZW50KSB7XG4gICAgdmFyIHN0eWxlID0gY3VycmVudEVsZW1lbnQuc3R5bGU7XG4gICAgdmFyIGVsZW1lbnRYUG9zaXRpb24gPSBwYXJzZUludChzdHlsZS5sZWZ0LCAxMCk7XG4gICAgdmFyIGVsZW1lbnRZUG9zaXRpb24gPSBwYXJzZUludChzdHlsZS50b3AsIDEwKTtcblxuICAgIHZhciBlbGVtZW50TmV3WFBvc2l0aW9uID0gZWxlbWVudFhQb3NpdGlvbiArIChldmVudC5jbGllbnRYIC0gY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbik7XG4gICAgdmFyIGVsZW1lbnROZXdZUG9zaXRpb24gPSBlbGVtZW50WVBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFkgLSBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uKTtcblxuICAgIHN0eWxlLmxlZnQgPSBpblBpeGVscyhlbGVtZW50TmV3WFBvc2l0aW9uKTtcbiAgICBzdHlsZS50b3AgPSBpblBpeGVscyhlbGVtZW50TmV3WVBvc2l0aW9uKTtcblxuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdHJpZ2dlckV2ZW50KCdkcmFnJywgeyB4OiBlbGVtZW50TmV3WFBvc2l0aW9uLCB5OiBlbGVtZW50TmV3WVBvc2l0aW9uLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbik7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVwb3NpdGlvbkVsZW1lbnQpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCByZW1vdmVEb2N1bWVudExpc3RlbmVycyk7XG5cbiAgICB2YXIgbGVmdCA9IHBhcnNlSW50KGN1cnJlbnRFbGVtZW50LnN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgdG9wID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUudG9wLCAxMCk7XG4gICAgdHJpZ2dlckV2ZW50KCdzdG9wJywgeyB4OiBsZWZ0LCB5OiB0b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgcmV0dXJuIGRyYWdnYWJsZTtcbn0pO1xuOyBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXyh0eXBlb2YgZHJhZ2dhYmxlICE9IFwidW5kZWZpbmVkXCIgPyBkcmFnZ2FibGUgOiB3aW5kb3cuZHJhZ2dhYmxlKTtcblxufSkuY2FsbChnbG9iYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZ1bmN0aW9uIGRlZmluZUV4cG9ydChleCkgeyBtb2R1bGUuZXhwb3J0cyA9IGV4OyB9KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiXX0=
