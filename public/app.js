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
        searchInput.value = presentation.getCurrentSlideIndex() + 1;
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

    exports.getCurrentSlideIndex = function() {
        return currentIndex;
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
        var anchor = document.createElement('a');
        anchor.href = '/';
        label.appendChild(anchor);
        label.classList.add('label', 'icon-presentr');
        anchor.innerHTML = 'presentr';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3NpZGViYXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jb21wb25lbnRzL2RyYWdnYWJsZS9kcmFnZ2FibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHByZXNlbnRhdGlvbk1vZHVsZSA9IHJlcXVpcmUoJy4vcHJlc2VudGF0aW9uJyksXG4gICAgdmlld3BvcnRPYnNlcnZlciA9IHJlcXVpcmUoJy4vdmlld3BvcnQtb2JzZXJ2ZXInKSxcbiAgICBzaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlYmFyJyksXG4gICAgcHJlc2VudGF0aW9uTmFtZSA9IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLXByZXNlbnRhdGlvbicpLFxuICAgIGlzUHJldmlld0RlY2sgPSB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gJyNwcmV2aWV3Jztcblxud2luZG93LnByZXNlbnRhdGlvbiA9IG5ldyBwcmVzZW50YXRpb25Nb2R1bGUoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGUnKSwgcHJlc2VudGF0aW9uTmFtZSwgaXNQcmV2aWV3RGVjayk7XG5uZXcgc2lkZWJhcih3aW5kb3cucHJlc2VudGF0aW9uKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMzcpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5wcmV2KCk7XG4gICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT09IDM5KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ubmV4dCgpO1xuICAgIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbyk7XG52aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2VhcmNoV3JhcHBlcixcbiAgICAgICAgc2VhcmNoSW5wdXQsXG4gICAgICAgIGlzT3BlbiA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2V0QmFzZUVsZW1lbnRzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QmFzZUVsZW1lbnRzKCkge1xuICAgICAgICBzZWFyY2hXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2dvdG9zbGlkZScpO1xuICAgICAgICBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIHNlYXJjaElucHV0LnR5cGUgPSAnbnVtYmVyJztcbiAgICAgICAgc2VhcmNoSW5wdXQubWluID0gMTtcbiAgICAgICAgc2VhcmNoSW5wdXQubWF4ID0gcHJlc2VudGF0aW9uLmdldFNsaWRlcygpLmxlbmd0aDtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hcHBlbmRDaGlsZChzZWFyY2hJbnB1dCk7XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzZWFyY2hXcmFwcGVyLCBldmVudC5jdXJyZW50VGFyZ2V0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZpcmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC52YWx1ZSA9IHByZXNlbnRhdGlvbi5nZXRDdXJyZW50U2xpZGVJbmRleCgpICsgMTtcbiAgICAgICAgaXNPcGVuID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWFyY2hXcmFwcGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2VhcmNoV3JhcHBlcik7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmaXJlKTtcbiAgICAgICAgaXNPcGVuID0gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKGlzT3Blbikge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZShldmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLm9wZW4oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGZpcmUoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICBwcmVzZW50YXRpb24uZ29UbyhzZWFyY2hJbnB1dC52YWx1ZSAtIDEpO1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDI3KSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzbGlkZXMsIG5hbWUsIGlzUHJldmlld0RlY2spIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudEluZGV4ID0gMCxcbiAgICAgICAgc29ja2V0O1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgaWYgKGlzUHJldmlld0RlY2spIHtcbiAgICAgICAgICAgIGFkZEVuZFNsaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0U2xpZGVzKCk7XG4gICAgICAgIHNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgc29ja2V0Lm9uKCdnb3RvLXNsaWRlJywgZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBleHBvcnRzLmdvVG8oZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7cHJlc2VudGF0aW9uOiBuYW1lfSk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5wcmV2ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXRDdXJyZW50U2xpZGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudEluZGV4O1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdvVG8gPSBmdW5jdGlvbihzbGlkZUluZGV4LCByZW1vdGVJbnZva2VkKSB7XG4gICAgICAgIGlmIChzbGlkZXMubGVuZ3RoID4gc2xpZGVJbmRleCkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdGVJbnZva2VkKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ2dvdG8tc2xpZGUnLCB7cHJlc2VudGF0aW9uTmFtZTogbmFtZSwgc2xpZGU6IHNsaWRlSW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlSW5kZXg7XG4gICAgICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLmdldFNsaWRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2xpZGVzO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFkZEVuZFNsaWRlKCkge1xuICAgICAgICB2YXIgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgICAgICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdzbGlkZScsICdlbmQnKTtcbiAgICAgICAgc2xpZGVzW3NsaWRlcy5sZW5ndGgtMV0ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYXJ0aWNsZSwgc2xpZGVzW3NsaWRlcy5sZW5ndGgtMV0ubmV4dFNpYmxpbmcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlcygpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleExvY2FsID0gaXNQcmV2aWV3RGVjayA/IChjdXJyZW50SW5kZXggKyAxKSA6IGN1cnJlbnRJbmRleDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNsaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgc2xpZGVzW2ldLmNsYXNzTGlzdC5yZW1vdmUoJ2N1cnJlbnQnLCAnbmV4dCcsICdwcmV2JywgJ25leHQtbmV4dCcsICdwcmV2LXByZXYnKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXNbY3VycmVudEluZGV4TG9jYWxdLmNsYXNzTGlzdC5hZGQoJ2N1cnJlbnQnKTtcbiAgICAgICAgdmFyIG5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKSxcbiAgICAgICAgICAgIHByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKTtcbiAgICAgICAgaWYgKG5leHRJbmRleCAhPT0gY3VycmVudEluZGV4TG9jYWwpIHtcbiAgICAgICAgICAgIHNsaWRlc1tuZXh0SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ25leHQnKTtcbiAgICAgICAgICAgIHZhciBuZXh0TmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgobmV4dEluZGV4KTtcbiAgICAgICAgICAgIGlmIChuZXh0TmV4dEluZGV4ICE9PSBuZXh0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbbmV4dE5leHRJbmRleF0uY2xhc3NMaXN0LmFkZCgnbmV4dC1uZXh0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZJbmRleCAhPT0gY3VycmVudEluZGV4TG9jYWwpIHtcbiAgICAgICAgICAgIHNsaWRlc1twcmV2SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ3ByZXYnKTtcbiAgICAgICAgICAgIHZhciBwcmV2UHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgocHJldkluZGV4KTtcbiAgICAgICAgICAgIGlmIChwcmV2UHJldkluZGV4ICE9PSBwcmV2SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbcHJldlByZXZJbmRleF0uY2xhc3NMaXN0LmFkZCgncHJldi1wcmV2Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggKyAxID49IHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzbGlkZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIHNpZGViYXIsXG4gICAgICAgIGVsZW1lbnRzTGlzdCxcbiAgICAgICAgZ290b3NsaWRlID0gcmVxdWlyZSgnLi9nb3Rvc2xpZGUnKSxcbiAgICAgICAgZWxlbWVudHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTcGVha2VydmlldycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3NwZWFrZXJ2aWV3LycgKyBwcmVzZW50YXRpb24uZ2V0TmFtZSgpLFxuICAgICAgICAgICAgICAgIHRhcmdldDogJ19ibGFuaycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNjcmVlbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdHbyB0byBzbGlkZScsXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBuZWVkcyB0byBiZWNvbWUgbW9yZSBnZW5lcmljXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBuZXcgZ290b3NsaWRlKHByZXNlbnRhdGlvbiksXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNlYXJjaCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdCcm93c2UgUHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3ByZXNlbnRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1tZW51J1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2V0QmFzZUVsZW1lbnRzKCk7XG4gICAgICAgIHNldEVsZW1lbnRzKCk7XG4gICAgICAgIHNldExpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QmFzZUVsZW1lbnRzKCkge1xuICAgICAgICBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcbiAgICAgICAgc2lkZWJhci5pZCA9ICdzaWRlYmFyJztcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKCdzaWRlYmFyJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2lkZWJhcik7XG4gICAgICAgIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gICAgICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIGFuY2hvci5ocmVmID0gJy8nO1xuICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChhbmNob3IpO1xuICAgICAgICBsYWJlbC5jbGFzc0xpc3QuYWRkKCdsYWJlbCcsICdpY29uLXByZXNlbnRyJyk7XG4gICAgICAgIGFuY2hvci5pbm5lckhUTUwgPSAncHJlc2VudHInO1xuICAgICAgICBzaWRlYmFyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRFbGVtZW50cygpIHtcbiAgICAgICAgZWxlbWVudHNMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChlbGVtZW50c0xpc3QpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLmFwcGVuZENoaWxkKGFuY2hvcik7XG4gICAgICAgICAgICBhbmNob3IuaW5uZXJIVE1MID0gZWxlbWVudHNbaV0ubGFiZWw7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmFjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuaHJlZiA9IGVsZW1lbnRzW2ldLmFjdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLnRhcmdldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yLnRhcmdldCA9IGVsZW1lbnRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuY2hvci5ocmVmID0gJyc7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZWxlbWVudHNbaV0uYWN0aW9uLnRvZ2dsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmNsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5jbGFzc0xpc3QuYWRkKGVsZW1lbnRzW2ldLmNsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRzTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRMaXN0ZW5lcigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBob3RLZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvdEtleShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMudG9nZ2xlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnb3BlbicpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwidmFyIHByZXNlbnRhdGlvbnMgPSBbXTtcblxuZXhwb3J0cy5yZWdpc3RlclByZXNlbnRhdGlvbiA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgIHByZXNlbnRhdGlvbnMuYWRkKHByZXNlbnRhdGlvbik7XG59O1xuXG5leHBvcnRzLnNldFJhdGlvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGFzcGVjdFJhdGlvID0gNC8zO1xuICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggKiBhc3BlY3RSYXRpbztcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB9XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuZm9udFNpemUgPSAoaGVpZ2h0ICogMC4wMDIpICsgJ2VtJztcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuIShmdW5jdGlvbihtb2R1bGVOYW1lLCBkZWZpbml0aW9uKSB7XG4gIC8vIFdoZXRoZXIgdG8gZXhwb3NlIERyYWdnYWJsZSBhcyBhbiBBTUQgbW9kdWxlIG9yIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW21vZHVsZU5hbWVdID0gZGVmaW5pdGlvbigpO1xuXG59KSgnZHJhZ2dhYmxlJywgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuICB2YXIgZmFpcmx5SGlnaFpJbmRleCA9ICcxMCc7XG5cbiAgZnVuY3Rpb24gZHJhZ2dhYmxlKGVsZW1lbnQsIGhhbmRsZSkge1xuICAgIGhhbmRsZSA9IGhhbmRsZSB8fCBlbGVtZW50O1xuICAgIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KTtcbiAgICBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzID0ge1xuICAgICAgc3RhcnQ6IFtdLFxuICAgICAgZHJhZzogW10sXG4gICAgICBzdG9wOiBbXVxuICAgIH07XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0YXJ0cyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdGFydCcpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdnaW5nID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ2RyYWcnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RvcHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RvcCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCkge1xuICAgIGN1cnJlbnRFbGVtZW50ICYmIHNlbmRUb0JhY2soY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gYnJpbmdUb0Zyb250KGVsZW1lbnQpO1xuXG5cbiAgICB2YXIgaW5pdGlhbFBvc2l0aW9uID0gZ2V0SW5pdGlhbFBvc2l0aW9uKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLmxlZnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi50b3ApO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdmFyIG9rVG9Hb09uID0gdHJpZ2dlckV2ZW50KCdzdGFydCcsIHsgeDogaW5pdGlhbFBvc2l0aW9uLmxlZnQsIHk6IGluaXRpYWxQb3NpdGlvbi50b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICAgIGlmICghb2tUb0dvT24pIHJldHVybjtcblxuICAgIGFkZERvY3VtZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihlbGVtZW50LCB0eXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGFyZ3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gY3VycmVudEVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0oYXJncykgPT09IGZhbHNlKSByZXN1bHQgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9CYWNrKGVsZW1lbnQpIHtcbiAgICB2YXIgZGVjcmVhc2VkWkluZGV4ID0gZmFpcmx5SGlnaFpJbmRleCAtIDE7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gYnJpbmdUb0Zyb250KGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZERvY3VtZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5pdGlhbFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdG9wID0gMDtcbiAgICB2YXIgbGVmdCA9IDA7XG4gICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICBkbyB7XG4gICAgICB0b3AgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgbGVmdCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIH0gd2hpbGUgKGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQub2Zmc2V0UGFyZW50KTtcblxuICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZT8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IGZhbHNlO1xuICAgIGlmIChjb21wdXRlZFN0eWxlKSB7XG4gICAgICBsZWZ0ID0gbGVmdCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tbGVmdCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItbGVmdCddKSB8fCAwKTtcbiAgICAgIHRvcCA9IHRvcCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tdG9wJ10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci10b3AnXSkgfHwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogdG9wLFxuICAgICAgbGVmdDogbGVmdFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBpblBpeGVscyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3NpdGlvbkVsZW1lbnQoZXZlbnQpIHtcbiAgICB2YXIgc3R5bGUgPSBjdXJyZW50RWxlbWVudC5zdHlsZTtcbiAgICB2YXIgZWxlbWVudFhQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgZWxlbWVudFlQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLnRvcCwgMTApO1xuXG4gICAgdmFyIGVsZW1lbnROZXdYUG9zaXRpb24gPSBlbGVtZW50WFBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFggLSBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uKTtcbiAgICB2YXIgZWxlbWVudE5ld1lQb3NpdGlvbiA9IGVsZW1lbnRZUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WSAtIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24pO1xuXG4gICAgc3R5bGUubGVmdCA9IGluUGl4ZWxzKGVsZW1lbnROZXdYUG9zaXRpb24pO1xuICAgIHN0eWxlLnRvcCA9IGluUGl4ZWxzKGVsZW1lbnROZXdZUG9zaXRpb24pO1xuXG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2RyYWcnLCB7IHg6IGVsZW1lbnROZXdYUG9zaXRpb24sIHk6IGVsZW1lbnROZXdZUG9zaXRpb24sIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcblxuICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciB0b3AgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS50b3AsIDEwKTtcbiAgICB0cmlnZ2VyRXZlbnQoJ3N0b3AnLCB7IHg6IGxlZnQsIHk6IHRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICByZXR1cm4gZHJhZ2dhYmxlO1xufSk7XG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkcmFnZ2FibGUgIT0gXCJ1bmRlZmluZWRcIiA/IGRyYWdnYWJsZSA6IHdpbmRvdy5kcmFnZ2FibGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
