require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.hash === '#preview';

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(window.presentation);

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
},{"./presentation":3,"./sidebar":4,"./viewport-observer":5}],2:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {},
        searchWrapper,
        searchInput,
        isOpen = false;

    function init() {
        setBaseElements();
    }

    function setBaseElements() {
        searchWrapper = document.createElement('section');
        searchWrapper.classList.add('gotoslide');
        searchInput = document.createElement('input');
        searchInput.type = 'number';
        searchInput.min = 1;
        searchInput.max = presentation.getSlides().length;
        searchWrapper.appendChild(searchInput);
    }

    init();

    exports.open = function(event) {
        event.currentTarget.parentNode.insertBefore(searchWrapper, event.currentTarget.nextSibling);
        searchWrapper.addEventListener('keyup', fire);
        isOpen = true;
    };

    exports.close = function() {
        searchWrapper.parentNode.removeChild(searchWrapper);
        searchWrapper.removeEventListener('keyup', fire);
        isOpen = false;
    };

    exports.toggle = function(event) {
        event.preventDefault();
        if (isOpen) {
            exports.close(event);
        } else {
            exports.open(event);
        }
    };

    function fire(event) {
        if (event.keyCode === 13) {
            presentation.goTo(searchInput.value - 1);
            exports.close();
        } else if (event.keyCode === 27) {
            exports.close();
        }
    }

    return exports;
};
},{}],3:[function(require,module,exports){
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

    exports.getSlides = function() {
        return slides;
    };

    exports.getName = function() {
        return name;
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
},{}],4:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {},
        sidebar,
        elementsList,
        gotoslide = require('./gotoslide'),
        elements = [
            {
                label: 'Speakerview',
                action: '/speakerview/' + presentation.getName(),
                target: '_blank',
                class: 'icon-screen'
            },
            {
                label: 'Go to slide',
                // This needs to become more generic
                action: new gotoslide(presentation),
                class: 'icon-search'
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
        label.classList.add('label', 'icon-presentr');
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
            } else {
                anchor.href = '';
                anchor.addEventListener('click', elements[i].action.toggle);
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
},{"./gotoslide":2}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3NpZGViYXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jb21wb25lbnRzL2RyYWdnYWJsZS9kcmFnZ2FibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpLFxuICAgIHNpZGViYXIgPSByZXF1aXJlKCcuL3NpZGViYXInKSxcbiAgICBwcmVzZW50YXRpb25OYW1lID0gZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJlc2VudGF0aW9uJyksXG4gICAgaXNQcmV2aWV3RGVjayA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAnI3ByZXZpZXcnO1xuXG53aW5kb3cucHJlc2VudGF0aW9uID0gbmV3IHByZXNlbnRhdGlvbk1vZHVsZShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpLCBwcmVzZW50YXRpb25OYW1lLCBpc1ByZXZpZXdEZWNrKTtcbm5ldyBzaWRlYmFyKHdpbmRvdy5wcmVzZW50YXRpb24pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAoZS5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB2aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKTtcbnZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBzZWFyY2hXcmFwcGVyLFxuICAgICAgICBzZWFyY2hJbnB1dCxcbiAgICAgICAgaXNPcGVuID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzZXRCYXNlRWxlbWVudHMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCYXNlRWxlbWVudHMoKSB7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWN0aW9uJyk7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnZ290b3NsaWRlJyk7XG4gICAgICAgIHNlYXJjaElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgc2VhcmNoSW5wdXQudHlwZSA9ICdudW1iZXInO1xuICAgICAgICBzZWFyY2hJbnB1dC5taW4gPSAxO1xuICAgICAgICBzZWFyY2hJbnB1dC5tYXggPSBwcmVzZW50YXRpb24uZ2V0U2xpZGVzKCkubGVuZ3RoO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmFwcGVuZENoaWxkKHNlYXJjaElucHV0KTtcbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICBleHBvcnRzLm9wZW4gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHNlYXJjaFdyYXBwZXIsIGV2ZW50LmN1cnJlbnRUYXJnZXQubmV4dFNpYmxpbmcpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZmlyZSk7XG4gICAgICAgIGlzT3BlbiA9IHRydWU7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNlYXJjaFdyYXBwZXIpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZmlyZSk7XG4gICAgICAgIGlzT3BlbiA9IGZhbHNlO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChpc09wZW4pIHtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoZXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBmaXJlKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLmdvVG8oc2VhcmNoSW5wdXQudmFsdWUgLSAxKTtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2xpZGVzLCBuYW1lLCBpc1ByZXZpZXdEZWNrKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGN1cnJlbnRJbmRleCA9IDAsXG4gICAgICAgIHNvY2tldDtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIGlmIChpc1ByZXZpZXdEZWNrKSB7XG4gICAgICAgICAgICBhZGRFbmRTbGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNldFNsaWRlcygpO1xuICAgICAgICBzb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgIHNvY2tldC5vbignZ290by1zbGlkZScsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgZXhwb3J0cy5nb1RvKGRhdGEsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgc29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge3ByZXNlbnRhdGlvbjogbmFtZX0pO1xuICAgIH1cblxuICAgIGV4cG9ydHMubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucHJldiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ29UbyA9IGZ1bmN0aW9uKHNsaWRlSW5kZXgsIHJlbW90ZUludm9rZWQpIHtcbiAgICAgICAgaWYgKHNsaWRlcy5sZW5ndGggPiBzbGlkZUluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIXJlbW90ZUludm9rZWQpIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgnZ290by1zbGlkZScsIHtwcmVzZW50YXRpb25OYW1lOiBuYW1lLCBzbGlkZTogc2xpZGVJbmRleH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudEluZGV4ID0gc2xpZGVJbmRleDtcbiAgICAgICAgICAgIHNldFNsaWRlcygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0U2xpZGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzbGlkZXM7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0TmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYWRkRW5kU2xpZGUoKSB7XG4gICAgICAgIHZhciBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICAgICAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NsaWRlJywgJ2VuZCcpO1xuICAgICAgICBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhcnRpY2xlLCBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5uZXh0U2libGluZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0U2xpZGVzKCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4TG9jYWwgPSBpc1ByZXZpZXdEZWNrID8gKGN1cnJlbnRJbmRleCArIDEpIDogY3VycmVudEluZGV4O1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBzbGlkZXNbaV0uY2xhc3NMaXN0LnJlbW92ZSgnY3VycmVudCcsICduZXh0JywgJ3ByZXYnLCAnbmV4dC1uZXh0JywgJ3ByZXYtcHJldicpO1xuICAgICAgICB9XG4gICAgICAgIHNsaWRlc1tjdXJyZW50SW5kZXhMb2NhbF0uY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpO1xuICAgICAgICB2YXIgbmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpLFxuICAgICAgICAgICAgcHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpO1xuICAgICAgICBpZiAobmV4dEluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW25leHRJbmRleF0uY2xhc3NMaXN0LmFkZCgnbmV4dCcpO1xuICAgICAgICAgICAgdmFyIG5leHROZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChuZXh0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHROZXh0SW5kZXggIT09IG5leHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1tuZXh0TmV4dEluZGV4XS5jbGFzc0xpc3QuYWRkKCduZXh0LW5leHQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldkluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW3ByZXZJbmRleF0uY2xhc3NMaXN0LmFkZCgncHJldicpO1xuICAgICAgICAgICAgdmFyIHByZXZQcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChwcmV2SW5kZXgpO1xuICAgICAgICAgICAgaWYgKHByZXZQcmV2SW5kZXggIT09IHByZXZJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1twcmV2UHJldkluZGV4XS5jbGFzc0xpc3QuYWRkKCdwcmV2LXByZXYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCArIDEgPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2lkZWJhcixcbiAgICAgICAgZWxlbWVudHNMaXN0LFxuICAgICAgICBnb3Rvc2xpZGUgPSByZXF1aXJlKCcuL2dvdG9zbGlkZScpLFxuICAgICAgICBlbGVtZW50cyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ1NwZWFrZXJ2aWV3JyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICcvc3BlYWtlcnZpZXcvJyArIHByZXNlbnRhdGlvbi5nZXROYW1lKCksXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnX2JsYW5rJyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tc2NyZWVuJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0dvIHRvIHNsaWRlJyxcbiAgICAgICAgICAgICAgICAvLyBUaGlzIG5lZWRzIHRvIGJlY29tZSBtb3JlIGdlbmVyaWNcbiAgICAgICAgICAgICAgICBhY3Rpb246IG5ldyBnb3Rvc2xpZGUocHJlc2VudGF0aW9uKSxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tc2VhcmNoJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0Jyb3dzZSBQcmVzZW50YXRpb25zJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICcvcHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLW1lbnUnXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzZXRCYXNlRWxlbWVudHMoKTtcbiAgICAgICAgc2V0RWxlbWVudHMoKTtcbiAgICAgICAgc2V0TGlzdGVuZXIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCYXNlRWxlbWVudHMoKSB7XG4gICAgICAgIHNpZGViYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhc2lkZScpO1xuICAgICAgICBzaWRlYmFyLmlkID0gJ3NpZGViYXInO1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ3NpZGViYXInKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzaWRlYmFyKTtcbiAgICAgICAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICAgICAgbGFiZWwuY2xhc3NMaXN0LmFkZCgnbGFiZWwnLCAnaWNvbi1wcmVzZW50cicpO1xuICAgICAgICBsYWJlbC5pbm5lckhUTUwgPSAncHJlc2VudHInO1xuICAgICAgICBzaWRlYmFyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRFbGVtZW50cygpIHtcbiAgICAgICAgZWxlbWVudHNMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChlbGVtZW50c0xpc3QpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLmFwcGVuZENoaWxkKGFuY2hvcik7XG4gICAgICAgICAgICBhbmNob3IuaW5uZXJIVE1MID0gZWxlbWVudHNbaV0ubGFiZWw7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmFjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuaHJlZiA9IGVsZW1lbnRzW2ldLmFjdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLnRhcmdldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yLnRhcmdldCA9IGVsZW1lbnRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuY2hvci5ocmVmID0gJyc7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZWxlbWVudHNbaV0uYWN0aW9uLnRvZ2dsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmNsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5jbGFzc0xpc3QuYWRkKGVsZW1lbnRzW2ldLmNsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRzTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRMaXN0ZW5lcigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBob3RLZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvdEtleShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMudG9nZ2xlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnb3BlbicpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwidmFyIHByZXNlbnRhdGlvbnMgPSBbXTtcblxuZXhwb3J0cy5yZWdpc3RlclByZXNlbnRhdGlvbiA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgIHByZXNlbnRhdGlvbnMuYWRkKHByZXNlbnRhdGlvbik7XG59O1xuXG5leHBvcnRzLnNldFJhdGlvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGFzcGVjdFJhdGlvID0gNC8zO1xuICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggKiBhc3BlY3RSYXRpbztcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB9XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuZm9udFNpemUgPSAoaGVpZ2h0ICogMC4wMDIpICsgJ2VtJztcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuIShmdW5jdGlvbihtb2R1bGVOYW1lLCBkZWZpbml0aW9uKSB7XG4gIC8vIFdoZXRoZXIgdG8gZXhwb3NlIERyYWdnYWJsZSBhcyBhbiBBTUQgbW9kdWxlIG9yIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW21vZHVsZU5hbWVdID0gZGVmaW5pdGlvbigpO1xuXG59KSgnZHJhZ2dhYmxlJywgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuICB2YXIgZmFpcmx5SGlnaFpJbmRleCA9ICcxMCc7XG5cbiAgZnVuY3Rpb24gZHJhZ2dhYmxlKGVsZW1lbnQsIGhhbmRsZSkge1xuICAgIGhhbmRsZSA9IGhhbmRsZSB8fCBlbGVtZW50O1xuICAgIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KTtcbiAgICBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzID0ge1xuICAgICAgc3RhcnQ6IFtdLFxuICAgICAgZHJhZzogW10sXG4gICAgICBzdG9wOiBbXVxuICAgIH07XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0YXJ0cyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdGFydCcpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdnaW5nID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ2RyYWcnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RvcHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RvcCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCkge1xuICAgIGN1cnJlbnRFbGVtZW50ICYmIHNlbmRUb0JhY2soY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gYnJpbmdUb0Zyb250KGVsZW1lbnQpO1xuXG5cbiAgICB2YXIgaW5pdGlhbFBvc2l0aW9uID0gZ2V0SW5pdGlhbFBvc2l0aW9uKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLmxlZnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi50b3ApO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdmFyIG9rVG9Hb09uID0gdHJpZ2dlckV2ZW50KCdzdGFydCcsIHsgeDogaW5pdGlhbFBvc2l0aW9uLmxlZnQsIHk6IGluaXRpYWxQb3NpdGlvbi50b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICAgIGlmICghb2tUb0dvT24pIHJldHVybjtcblxuICAgIGFkZERvY3VtZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihlbGVtZW50LCB0eXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGFyZ3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gY3VycmVudEVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0oYXJncykgPT09IGZhbHNlKSByZXN1bHQgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9CYWNrKGVsZW1lbnQpIHtcbiAgICB2YXIgZGVjcmVhc2VkWkluZGV4ID0gZmFpcmx5SGlnaFpJbmRleCAtIDE7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gYnJpbmdUb0Zyb250KGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZERvY3VtZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5pdGlhbFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdG9wID0gMDtcbiAgICB2YXIgbGVmdCA9IDA7XG4gICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICBkbyB7XG4gICAgICB0b3AgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgbGVmdCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIH0gd2hpbGUgKGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQub2Zmc2V0UGFyZW50KTtcblxuICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZT8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IGZhbHNlO1xuICAgIGlmIChjb21wdXRlZFN0eWxlKSB7XG4gICAgICBsZWZ0ID0gbGVmdCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tbGVmdCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItbGVmdCddKSB8fCAwKTtcbiAgICAgIHRvcCA9IHRvcCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tdG9wJ10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci10b3AnXSkgfHwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogdG9wLFxuICAgICAgbGVmdDogbGVmdFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBpblBpeGVscyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3NpdGlvbkVsZW1lbnQoZXZlbnQpIHtcbiAgICB2YXIgc3R5bGUgPSBjdXJyZW50RWxlbWVudC5zdHlsZTtcbiAgICB2YXIgZWxlbWVudFhQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgZWxlbWVudFlQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLnRvcCwgMTApO1xuXG4gICAgdmFyIGVsZW1lbnROZXdYUG9zaXRpb24gPSBlbGVtZW50WFBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFggLSBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uKTtcbiAgICB2YXIgZWxlbWVudE5ld1lQb3NpdGlvbiA9IGVsZW1lbnRZUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WSAtIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24pO1xuXG4gICAgc3R5bGUubGVmdCA9IGluUGl4ZWxzKGVsZW1lbnROZXdYUG9zaXRpb24pO1xuICAgIHN0eWxlLnRvcCA9IGluUGl4ZWxzKGVsZW1lbnROZXdZUG9zaXRpb24pO1xuXG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2RyYWcnLCB7IHg6IGVsZW1lbnROZXdYUG9zaXRpb24sIHk6IGVsZW1lbnROZXdZUG9zaXRpb24sIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcblxuICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciB0b3AgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS50b3AsIDEwKTtcbiAgICB0cmlnZ2VyRXZlbnQoJ3N0b3AnLCB7IHg6IGxlZnQsIHk6IHRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICByZXR1cm4gZHJhZ2dhYmxlO1xufSk7XG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkcmFnZ2FibGUgIT0gXCJ1bmRlZmluZWRcIiA/IGRyYWdnYWJsZSA6IHdpbmRvdy5kcmFnZ2FibGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
