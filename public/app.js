require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.hash === '#preview';

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(presentationName);

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
},{"./presentation":2,"./sidebar":3,"./viewport-observer":4}],2:[function(require,module,exports){
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
module.exports = function(presentationName) {
    'use strict';
    var exports = {},
        sidebar,
        elementsList,
        elements = [
            {
                label: 'Speakerview',
                action: '/speakerview/' + presentationName,
                target: '_blank',
                class: 'icon-screen'
            },
            {
                label: 'Browse Presentations',
                action: '/presentations',
                class: 'icon-menu'
            }
        ];

    function init() {
        setBaseElements();
        setElements();
        setListener();
    }

    function setBaseElements() {
        sidebar = document.createElement('aside');
        sidebar.id = 'sidebar';
        sidebar.classList.add('sidebar');
        document.body.appendChild(sidebar);
        var label = document.createElement('h1');
        label.classList.add('label');
        label.innerHTML = 'presentr';
        sidebar.appendChild(label);
    }

    function setElements() {
        elementsList = document.createElement('ul');
        sidebar.appendChild(elementsList);
        for (var i = 0; i < elements.length; i++) {
            var listItem = document.createElement('li');
            var anchor = document.createElement('a');
            listItem.appendChild(anchor);
            anchor.innerHTML = elements[i].label;
            if (typeof elements[i].action === 'string') {
                anchor.href = elements[i].action;
                if (typeof elements[i].target !== 'undefined') {
                    anchor.target = elements[i].target;
                }
            }
            if (typeof elements[i].class !== 'undefined') {
                anchor.classList.add(elements[i].class);
            }
            elementsList.appendChild(listItem);
        }
    }

    function setListener() {
        document.addEventListener('keyup', hotKey);
    }

    function hotKey(event) {
        if (event.keyCode === 77) {
            exports.toggle();
        }
    }

    exports.toggle = function() {
        if (sidebar.classList.contains('open')) {
            exports.close();
        } else {
            exports.open();
        }
    };

    exports.open = function() {
        sidebar.classList.add('open');
    };

    exports.close = function() {
        sidebar.classList.remove('open');
    };

    init();

    return exports;
};
},{}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvc2lkZWJhci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC92aWV3cG9ydC1vYnNlcnZlci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NvbXBvbmVudHMvZHJhZ2dhYmxlL2RyYWdnYWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHByZXNlbnRhdGlvbk1vZHVsZSA9IHJlcXVpcmUoJy4vcHJlc2VudGF0aW9uJyksXG4gICAgdmlld3BvcnRPYnNlcnZlciA9IHJlcXVpcmUoJy4vdmlld3BvcnQtb2JzZXJ2ZXInKSxcbiAgICBzaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlYmFyJyksXG4gICAgcHJlc2VudGF0aW9uTmFtZSA9IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLXByZXNlbnRhdGlvbicpLFxuICAgIGlzUHJldmlld0RlY2sgPSB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gJyNwcmV2aWV3Jztcblxud2luZG93LnByZXNlbnRhdGlvbiA9IG5ldyBwcmVzZW50YXRpb25Nb2R1bGUoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGUnKSwgcHJlc2VudGF0aW9uTmFtZSwgaXNQcmV2aWV3RGVjayk7XG5uZXcgc2lkZWJhcihwcmVzZW50YXRpb25OYW1lKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMzcpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5wcmV2KCk7XG4gICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT09IDM5KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ubmV4dCgpO1xuICAgIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbyk7XG52aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzbGlkZXMsIG5hbWUsIGlzUHJldmlld0RlY2spIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudEluZGV4ID0gMCxcbiAgICAgICAgc29ja2V0O1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgaWYgKGlzUHJldmlld0RlY2spIHtcbiAgICAgICAgICAgIGFkZEVuZFNsaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0U2xpZGVzKCk7XG4gICAgICAgIHNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgc29ja2V0Lm9uKCdnb3RvLXNsaWRlJywgZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBleHBvcnRzLmdvVG8oZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7cHJlc2VudGF0aW9uOiBuYW1lfSk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5wcmV2ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nb1RvID0gZnVuY3Rpb24oc2xpZGVJbmRleCwgcmVtb3RlSW52b2tlZCkge1xuICAgICAgICBpZiAoc2xpZGVzLmxlbmd0aCA+IHNsaWRlSW5kZXgpIHtcbiAgICAgICAgICAgIGlmICghcmVtb3RlSW52b2tlZCkge1xuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KCdnb3RvLXNsaWRlJywge3ByZXNlbnRhdGlvbk5hbWU6IG5hbWUsIHNsaWRlOiBzbGlkZUluZGV4fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPSBzbGlkZUluZGV4O1xuICAgICAgICAgICAgc2V0U2xpZGVzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYWRkRW5kU2xpZGUoKSB7XG4gICAgICAgIHZhciBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICAgICAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NsaWRlJywgJ2VuZCcpO1xuICAgICAgICBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhcnRpY2xlLCBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5uZXh0U2libGluZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0U2xpZGVzKCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4TG9jYWwgPSBpc1ByZXZpZXdEZWNrID8gKGN1cnJlbnRJbmRleCArIDEpIDogY3VycmVudEluZGV4O1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBzbGlkZXNbaV0uY2xhc3NMaXN0LnJlbW92ZSgnY3VycmVudCcsICduZXh0JywgJ3ByZXYnLCAnbmV4dC1uZXh0JywgJ3ByZXYtcHJldicpO1xuICAgICAgICB9XG4gICAgICAgIHNsaWRlc1tjdXJyZW50SW5kZXhMb2NhbF0uY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpO1xuICAgICAgICB2YXIgbmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpLFxuICAgICAgICAgICAgcHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpO1xuICAgICAgICBpZiAobmV4dEluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW25leHRJbmRleF0uY2xhc3NMaXN0LmFkZCgnbmV4dCcpO1xuICAgICAgICAgICAgdmFyIG5leHROZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChuZXh0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHROZXh0SW5kZXggIT09IG5leHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1tuZXh0TmV4dEluZGV4XS5jbGFzc0xpc3QuYWRkKCduZXh0LW5leHQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldkluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW3ByZXZJbmRleF0uY2xhc3NMaXN0LmFkZCgncHJldicpO1xuICAgICAgICAgICAgdmFyIHByZXZQcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChwcmV2SW5kZXgpO1xuICAgICAgICAgICAgaWYgKHByZXZQcmV2SW5kZXggIT09IHByZXZJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1twcmV2UHJldkluZGV4XS5jbGFzc0xpc3QuYWRkKCdwcmV2LXByZXYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCArIDEgPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb25OYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIHNpZGViYXIsXG4gICAgICAgIGVsZW1lbnRzTGlzdCxcbiAgICAgICAgZWxlbWVudHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTcGVha2VydmlldycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3NwZWFrZXJ2aWV3LycgKyBwcmVzZW50YXRpb25OYW1lLFxuICAgICAgICAgICAgICAgIHRhcmdldDogJ19ibGFuaycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNjcmVlbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdCcm93c2UgUHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3ByZXNlbnRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1tZW51J1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2V0QmFzZUVsZW1lbnRzKCk7XG4gICAgICAgIHNldEVsZW1lbnRzKCk7XG4gICAgICAgIHNldExpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QmFzZUVsZW1lbnRzKCkge1xuICAgICAgICBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcbiAgICAgICAgc2lkZWJhci5pZCA9ICdzaWRlYmFyJztcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKCdzaWRlYmFyJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2lkZWJhcik7XG4gICAgICAgIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gICAgICAgIGxhYmVsLmNsYXNzTGlzdC5hZGQoJ2xhYmVsJyk7XG4gICAgICAgIGxhYmVsLmlubmVySFRNTCA9ICdwcmVzZW50cic7XG4gICAgICAgIHNpZGViYXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEVsZW1lbnRzKCkge1xuICAgICAgICBlbGVtZW50c0xpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICBzaWRlYmFyLmFwcGVuZENoaWxkKGVsZW1lbnRzTGlzdCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgICAgICB2YXIgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgbGlzdEl0ZW0uYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICAgICAgICAgIGFuY2hvci5pbm5lckhUTUwgPSBlbGVtZW50c1tpXS5sYWJlbDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0uYWN0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5ocmVmID0gZWxlbWVudHNbaV0uYWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0udGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBhbmNob3IudGFyZ2V0ID0gZWxlbWVudHNbaV0udGFyZ2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0uY2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmNsYXNzTGlzdC5hZGQoZWxlbWVudHNbaV0uY2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudHNMaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldExpc3RlbmVyKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGhvdEtleSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaG90S2V5KGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSA3Nykge1xuICAgICAgICAgICAgZXhwb3J0cy50b2dnbGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzaWRlYmFyLmNsYXNzTGlzdC5jb250YWlucygnb3BlbicpKSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLm9wZW4oKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKCdvcGVuJyk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XG4gICAgfTtcblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJ2YXIgcHJlc2VudGF0aW9ucyA9IFtdO1xuXG5leHBvcnRzLnJlZ2lzdGVyUHJlc2VudGF0aW9uID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgcHJlc2VudGF0aW9ucy5hZGQocHJlc2VudGF0aW9uKTtcbn07XG5cbmV4cG9ydHMuc2V0UmF0aW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgYXNwZWN0UmF0aW8gPSA0LzM7XG4gICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVySGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIH1cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5mb250U2l6ZSA9IChoZWlnaHQgKiAwLjAwMikgKyAnZW0nO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4oZnVuY3Rpb24gYnJvd3NlcmlmeVNoaW0obW9kdWxlLCBleHBvcnRzLCBkZWZpbmUsIGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKSB7XG4hKGZ1bmN0aW9uKG1vZHVsZU5hbWUsIGRlZmluaXRpb24pIHtcbiAgLy8gV2hldGhlciB0byBleHBvc2UgRHJhZ2dhYmxlIGFzIGFuIEFNRCBtb2R1bGUgb3IgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pO1xuICBlbHNlIHRoaXNbbW9kdWxlTmFtZV0gPSBkZWZpbml0aW9uKCk7XG5cbn0pKCdkcmFnZ2FibGUnLCBmdW5jdGlvbiBkZWZpbml0aW9uKCkge1xuICB2YXIgY3VycmVudEVsZW1lbnQ7XG4gIHZhciBmYWlybHlIaWdoWkluZGV4ID0gJzEwJztcblxuICBmdW5jdGlvbiBkcmFnZ2FibGUoZWxlbWVudCwgaGFuZGxlKSB7XG4gICAgaGFuZGxlID0gaGFuZGxlIHx8IGVsZW1lbnQ7XG4gICAgc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpO1xuICAgIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHN0YXJ0RHJhZ2dpbmcoZXZlbnQsIGVsZW1lbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnMgPSB7XG4gICAgICBzdGFydDogW10sXG4gICAgICBkcmFnOiBbXSxcbiAgICAgIHN0b3A6IFtdXG4gICAgfTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RhcnRzID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ3N0YXJ0Jyk7XG4gICAgZWxlbWVudC53aGVuRHJhZ2dpbmcgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnZHJhZycpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdTdG9wcyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdG9wJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KSB7XG4gICAgY3VycmVudEVsZW1lbnQgJiYgc2VuZFRvQmFjayhjdXJyZW50RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQgPSBicmluZ1RvRnJvbnQoZWxlbWVudCk7XG5cblxuICAgIHZhciBpbml0aWFsUG9zaXRpb24gPSBnZXRJbml0aWFsUG9zaXRpb24oY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLmxlZnQgPSBpblBpeGVscyhpbml0aWFsUG9zaXRpb24ubGVmdCk7XG4gICAgY3VycmVudEVsZW1lbnQuc3R5bGUudG9wID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLnRvcCk7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB2YXIgb2tUb0dvT24gPSB0cmlnZ2VyRXZlbnQoJ3N0YXJ0JywgeyB4OiBpbml0aWFsUG9zaXRpb24ubGVmdCwgeTogaW5pdGlhbFBvc2l0aW9uLnRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gICAgaWYgKCFva1RvR29PbikgcmV0dXJuO1xuXG4gICAgYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGVsZW1lbnQsIHR5cGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQodHlwZSwgYXJncykge1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBjdXJyZW50RWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnNbdHlwZV07XG4gICAgZm9yICh2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXShhcmdzKSA9PT0gZmFsc2UpIHJlc3VsdCA9IGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRUb0JhY2soZWxlbWVudCkge1xuICAgIHZhciBkZWNyZWFzZWRaSW5kZXggPSBmYWlybHlIaWdoWkluZGV4IC0gMTtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiBicmluZ1RvRnJvbnQoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGVbJ3otaW5kZXgnXSA9IGZhaXJseUhpZ2haSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbik7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVwb3NpdGlvbkVsZW1lbnQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCByZW1vdmVEb2N1bWVudExpc3RlbmVycyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJbml0aWFsUG9zaXRpb24oZWxlbWVudCkge1xuICAgIHZhciB0b3AgPSAwO1xuICAgIHZhciBsZWZ0ID0gMDtcbiAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGRvIHtcbiAgICAgIHRvcCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICBsZWZ0ICs9IGN1cnJlbnRFbGVtZW50Lm9mZnNldExlZnQ7XG4gICAgfSB3aGlsZSAoY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5vZmZzZXRQYXJlbnQpO1xuXG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlPyBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIDogZmFsc2U7XG4gICAgaWYgKGNvbXB1dGVkU3R5bGUpIHtcbiAgICAgIGxlZnQgPSBsZWZ0IC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi1sZWZ0J10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci1sZWZ0J10pIHx8IDApO1xuICAgICAgdG9wID0gdG9wIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi10b3AnXSkgfHwgMCkgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnYm9yZGVyLXRvcCddKSB8fCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiB0b3AsXG4gICAgICBsZWZ0OiBsZWZ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluUGl4ZWxzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICsgJ3B4JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQgJiYgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gJiYgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZXBvc2l0aW9uRWxlbWVudChldmVudCkge1xuICAgIHZhciBzdHlsZSA9IGN1cnJlbnRFbGVtZW50LnN0eWxlO1xuICAgIHZhciBlbGVtZW50WFBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciBlbGVtZW50WVBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUudG9wLCAxMCk7XG5cbiAgICB2YXIgZWxlbWVudE5ld1hQb3NpdGlvbiA9IGVsZW1lbnRYUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WCAtIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24pO1xuICAgIHZhciBlbGVtZW50TmV3WVBvc2l0aW9uID0gZWxlbWVudFlQb3NpdGlvbiArIChldmVudC5jbGllbnRZIC0gY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbik7XG5cbiAgICBzdHlsZS5sZWZ0ID0gaW5QaXhlbHMoZWxlbWVudE5ld1hQb3NpdGlvbik7XG4gICAgc3R5bGUudG9wID0gaW5QaXhlbHMoZWxlbWVudE5ld1lQb3NpdGlvbik7XG5cbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uID0gZXZlbnQuY2xpZW50WDtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uID0gZXZlbnQuY2xpZW50WTtcblxuICAgIHRyaWdnZXJFdmVudCgnZHJhZycsIHsgeDogZWxlbWVudE5ld1hQb3NpdGlvbiwgeTogZWxlbWVudE5ld1lQb3NpdGlvbiwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVEb2N1bWVudExpc3RlbmVycyhldmVudCkge1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuXG4gICAgdmFyIGxlZnQgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0LCAxMCk7XG4gICAgdmFyIHRvcCA9IHBhcnNlSW50KGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCwgMTApO1xuICAgIHRyaWdnZXJFdmVudCgnc3RvcCcsIHsgeDogbGVmdCwgeTogdG9wLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgfVxuXG4gIHJldHVybiBkcmFnZ2FibGU7XG59KTtcbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIGRyYWdnYWJsZSAhPSBcInVuZGVmaW5lZFwiID8gZHJhZ2dhYmxlIDogd2luZG93LmRyYWdnYWJsZSk7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
