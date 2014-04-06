require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.href.indexOf('/preview', window.location.href.length - 8) > 0;

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
},{"./presentation":4,"./sidebar":5,"./viewport-observer":7}],2:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {},
        searchWrapper,
        searchInput,
        slideHeadline,
        isOpen = false,
        slides;

    function init() {
        slides = presentation.getSlides();
        setBaseElements();
    }

    function setBaseElements() {
        searchWrapper = document.createElement('section');
        searchWrapper.classList.add('gotoslide');
        searchInput = document.createElement('input');
        searchInput.type = 'number';
        searchInput.min = 1;
        searchInput.max = slides.length;
        searchWrapper.appendChild(searchInput);
        slideHeadline = document.createElement('span');
        slideHeadline.classList.add('slide-headline');
        searchWrapper.appendChild(slideHeadline);
        slideHeadline.addEventListener('click', goToSelectedSlide);
    }

    exports.open = function(event) {
        event.currentTarget.parentNode.insertBefore(searchWrapper, event.currentTarget.nextSibling);
        searchWrapper.addEventListener('keyup', fire);
        searchInput.addEventListener('input', setSlideHeadline);
        searchInput.addEventListener('change', setSlideHeadline);
        searchInput.value = presentation.getCurrentSlideIndex() + 1;
        setSlideHeadline();
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

    function setSlideHeadline() {
        slideHeadline.innerHTML = slides[searchInput.value - 1].getHeadline();
    }

    function goToSelectedSlide() {
        presentation.goTo(searchInput.value - 1);
    }

    function fire(event) {
        if (event.keyCode === 13) {
            goToSelectedSlide();
            exports.close();
        } else if (event.keyCode === 27) {
            exports.close();
        }
    }

    init();

    return exports;
};
},{}],3:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {};

    exports.toggle = function(event) {
        event.preventDefault();
        if (presentation.isConnected()) {
            presentation.disconnect();
            event.currentTarget.classList.remove('icon-connected');
            event.currentTarget.classList.add('icon-disconnected');
            event.currentTarget.innerHTML = 'Connect to session';
        } else {
            presentation.connect();
            event.currentTarget.classList.remove('icon-disconnected');
            event.currentTarget.classList.add('icon-connected');
            event.currentTarget.innerHTML = 'Disconnect from session';
        }
    };

    return exports;
};
},{}],4:[function(require,module,exports){
module.exports = function(slideElements, name, isPreviewDeck) {
    'use strict';
    var exports = {},
        currentIndex = 0,
        socket,
        Slide = require('./slide'),
        slides = [];

    function init() {
        initSlides();
        if (isPreviewDeck) {
            addEndSlide();
        }
        if (window.location.hash !== '') {
            hashChanged();
        } else {
            exports.goTo(0);
        }
        window.addEventListener('hashchange', hashChanged);
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
            if (!remoteInvoked && typeof socket !== 'undefined') {
                socket.emit('goto-slide', {presentationName: name, slide: slideIndex});
            }
            currentIndex = slideIndex;
            window.location.hash = currentIndex + 1;
            setSlides();
        }
    };

    exports.getSlides = function() {
        return slides;
    };

    exports.getName = function() {
        return name;
    };

    exports.isConnected = function() {
        return typeof socket !== 'undefined' && socket.socket.connected;
    };

    exports.connect = function() {
        if (typeof socket === 'undefined') {
            socket = io.connect('http://localhost');
            socket.on('goto-slide', function(data){
                exports.goTo(data, true);
            });
        } else {
            socket.socket.connect();
        }
        socket.emit('register', {presentation: name});
    };

    exports.disconnect = function() {
        socket.disconnect();
    };

    function initSlides() {
        for (var i = 0; i < slideElements.length; i++) {
            slides.push(new Slide(slideElements[i]));
        }
    }

    function hashChanged() {
        exports.goTo(parseInt(window.location.hash.substring(1)) - 1);
    }

    function addEndSlide() {
        var article = document.createElement('article');
        article.classList.add('slide', 'end');
        slides[slides.length-1].getDomNode().parentNode.insertBefore(article, slides[slides.length-1].nextSibling);
        slides.push(new Slide(article));
    }

    function setSlides() {
        var currentIndexLocal = isPreviewDeck ? (currentIndex + 1) : currentIndex;
        for (var i = slides.length - 1; i >= 0; i--) {
            slides[i].clearStatus();
        }
        slides[currentIndexLocal].setStatus('current');
        var nextIndex = getNextSlideIndex(currentIndexLocal),
            prevIndex = getPrevSlideIndex(currentIndexLocal);
        if (nextIndex !== currentIndexLocal) {
            slides[nextIndex].setStatus('next');
            var nextNextIndex = getNextSlideIndex(nextIndex);
            if (nextNextIndex !== nextIndex) {
                slides[nextNextIndex].setStatus('next-next');
            }
        }
        if (prevIndex !== currentIndexLocal) {
            slides[prevIndex].setStatus('prev');
            var prevPrevIndex = getPrevSlideIndex(prevIndex);
            if (prevPrevIndex !== prevIndex) {
                slides[prevPrevIndex].setStatus('prev-prev');
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
},{"./slide":6}],5:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {},
        sidebar,
        elementsList,
        Gotoslide = require('./gotoslide'),
        PresentationConnector = require('./presentation-connector'),
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
                action: new Gotoslide(presentation).toggle,
                class: 'icon-search'
            },
            {
                label: 'Connect to session',
                action: new PresentationConnector(presentation).toggle,
                class: 'icon-disconnected'
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
                anchor.addEventListener('click', elements[i].action);
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
},{"./gotoslide":2,"./presentation-connector":3}],6:[function(require,module,exports){
module.exports = function(slideElement) {
    'use strict';
    var exports = {},
        currentStatus = {},
        headline;

    exports.setStatus = function(status) {
        slideElement.classList.add(status);
        currentStatus[status] = status;
    };

    exports.clearStatus = function() {
        for (var status in currentStatus) {
            slideElement.classList.remove(status);
            delete currentStatus[status];
        }
    };

    exports.getHeadline = function() {
        if (typeof headline === 'undefined') {
            var search = slideElement.innerHTML.match(/<h1.*>(.*)<\/h1>/);
            headline = search[1];
        }
        return headline;
    };

    exports.getDomNode = function() {
        return slideElement;
    };

    return exports;
};
},{}],7:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLWNvbm5lY3Rvci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvc2lkZWJhci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9zbGlkZS5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC92aWV3cG9ydC1vYnNlcnZlci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NvbXBvbmVudHMvZHJhZ2dhYmxlL2RyYWdnYWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpLFxuICAgIHNpZGViYXIgPSByZXF1aXJlKCcuL3NpZGViYXInKSxcbiAgICBwcmVzZW50YXRpb25OYW1lID0gZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJlc2VudGF0aW9uJyksXG4gICAgaXNQcmV2aWV3RGVjayA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJy9wcmV2aWV3Jywgd2luZG93LmxvY2F0aW9uLmhyZWYubGVuZ3RoIC0gOCkgPiAwO1xuXG53aW5kb3cucHJlc2VudGF0aW9uID0gbmV3IHByZXNlbnRhdGlvbk1vZHVsZShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpLCBwcmVzZW50YXRpb25OYW1lLCBpc1ByZXZpZXdEZWNrKTtcbm5ldyBzaWRlYmFyKHdpbmRvdy5wcmVzZW50YXRpb24pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAoZS5rZXlDb2RlID09PSAzNykge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PT0gMzkpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB2aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKTtcbnZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBzZWFyY2hXcmFwcGVyLFxuICAgICAgICBzZWFyY2hJbnB1dCxcbiAgICAgICAgc2xpZGVIZWFkbGluZSxcbiAgICAgICAgaXNPcGVuID0gZmFsc2UsXG4gICAgICAgIHNsaWRlcztcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHNsaWRlcyA9IHByZXNlbnRhdGlvbi5nZXRTbGlkZXMoKTtcbiAgICAgICAgc2V0QmFzZUVsZW1lbnRzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QmFzZUVsZW1lbnRzKCkge1xuICAgICAgICBzZWFyY2hXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2dvdG9zbGlkZScpO1xuICAgICAgICBzZWFyY2hJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIHNlYXJjaElucHV0LnR5cGUgPSAnbnVtYmVyJztcbiAgICAgICAgc2VhcmNoSW5wdXQubWluID0gMTtcbiAgICAgICAgc2VhcmNoSW5wdXQubWF4ID0gc2xpZGVzLmxlbmd0aDtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hcHBlbmRDaGlsZChzZWFyY2hJbnB1dCk7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUuY2xhc3NMaXN0LmFkZCgnc2xpZGUtaGVhZGxpbmUnKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hcHBlbmRDaGlsZChzbGlkZUhlYWRsaW5lKTtcbiAgICAgICAgc2xpZGVIZWFkbGluZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGdvVG9TZWxlY3RlZFNsaWRlKTtcbiAgICB9XG5cbiAgICBleHBvcnRzLm9wZW4gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHNlYXJjaFdyYXBwZXIsIGV2ZW50LmN1cnJlbnRUYXJnZXQubmV4dFNpYmxpbmcpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZmlyZSk7XG4gICAgICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0Jywgc2V0U2xpZGVIZWFkbGluZSk7XG4gICAgICAgIHNlYXJjaElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHNldFNsaWRlSGVhZGxpbmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC52YWx1ZSA9IHByZXNlbnRhdGlvbi5nZXRDdXJyZW50U2xpZGVJbmRleCgpICsgMTtcbiAgICAgICAgc2V0U2xpZGVIZWFkbGluZSgpO1xuICAgICAgICBpc09wZW4gPSB0cnVlO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzZWFyY2hXcmFwcGVyKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZpcmUpO1xuICAgICAgICBpc09wZW4gPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy50b2dnbGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoaXNPcGVuKSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMub3BlbihldmVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc2V0U2xpZGVIZWFkbGluZSgpIHtcbiAgICAgICAgc2xpZGVIZWFkbGluZS5pbm5lckhUTUwgPSBzbGlkZXNbc2VhcmNoSW5wdXQudmFsdWUgLSAxXS5nZXRIZWFkbGluZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdvVG9TZWxlY3RlZFNsaWRlKCkge1xuICAgICAgICBwcmVzZW50YXRpb24uZ29UbyhzZWFyY2hJbnB1dC52YWx1ZSAtIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpcmUoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICBnb1RvU2VsZWN0ZWRTbGlkZSgpO1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IDI3KSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHByZXNlbnRhdGlvbi5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgICAgICAgICBwcmVzZW50YXRpb24uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdpY29uLWNvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKCdpY29uLWRpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5pbm5lckhUTUwgPSAnQ29ubmVjdCB0byBzZXNzaW9uJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZXNlbnRhdGlvbi5jb25uZWN0KCk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2ljb24tZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2ljb24tY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmlubmVySFRNTCA9ICdEaXNjb25uZWN0IGZyb20gc2Vzc2lvbic7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2xpZGVFbGVtZW50cywgbmFtZSwgaXNQcmV2aWV3RGVjaykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBjdXJyZW50SW5kZXggPSAwLFxuICAgICAgICBzb2NrZXQsXG4gICAgICAgIFNsaWRlID0gcmVxdWlyZSgnLi9zbGlkZScpLFxuICAgICAgICBzbGlkZXMgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIGluaXRTbGlkZXMoKTtcbiAgICAgICAgaWYgKGlzUHJldmlld0RlY2spIHtcbiAgICAgICAgICAgIGFkZEVuZFNsaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoICE9PSAnJykge1xuICAgICAgICAgICAgaGFzaENoYW5nZWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMuZ29UbygwKTtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIGhhc2hDaGFuZ2VkKTtcbiAgICB9XG5cbiAgICBleHBvcnRzLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnByZXYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleCkpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldEN1cnJlbnRTbGlkZUluZGV4ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50SW5kZXg7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ29UbyA9IGZ1bmN0aW9uKHNsaWRlSW5kZXgsIHJlbW90ZUludm9rZWQpIHtcbiAgICAgICAgaWYgKHNsaWRlcy5sZW5ndGggPiBzbGlkZUluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIXJlbW90ZUludm9rZWQgJiYgdHlwZW9mIHNvY2tldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgnZ290by1zbGlkZScsIHtwcmVzZW50YXRpb25OYW1lOiBuYW1lLCBzbGlkZTogc2xpZGVJbmRleH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudEluZGV4ID0gc2xpZGVJbmRleDtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgIHNldFNsaWRlcygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0U2xpZGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzbGlkZXM7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0TmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHNvY2tldCAhPT0gJ3VuZGVmaW5lZCcgJiYgc29ja2V0LnNvY2tldC5jb25uZWN0ZWQ7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodHlwZW9mIHNvY2tldCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNvY2tldCA9IGlvLmNvbm5lY3QoJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgICAgIHNvY2tldC5vbignZ290by1zbGlkZScsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIGV4cG9ydHMuZ29UbyhkYXRhLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0LnNvY2tldC5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge3ByZXNlbnRhdGlvbjogbmFtZX0pO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaW5pdFNsaWRlcygpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGlkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzbGlkZXMucHVzaChuZXcgU2xpZGUoc2xpZGVFbGVtZW50c1tpXSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzaENoYW5nZWQoKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhwYXJzZUludCh3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkpIC0gMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRW5kU2xpZGUoKSB7XG4gICAgICAgIHZhciBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICAgICAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NsaWRlJywgJ2VuZCcpO1xuICAgICAgICBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5nZXREb21Ob2RlKCkucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYXJ0aWNsZSwgc2xpZGVzW3NsaWRlcy5sZW5ndGgtMV0ubmV4dFNpYmxpbmcpO1xuICAgICAgICBzbGlkZXMucHVzaChuZXcgU2xpZGUoYXJ0aWNsZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlcygpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleExvY2FsID0gaXNQcmV2aWV3RGVjayA/IChjdXJyZW50SW5kZXggKyAxKSA6IGN1cnJlbnRJbmRleDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNsaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgc2xpZGVzW2ldLmNsZWFyU3RhdHVzKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVzW2N1cnJlbnRJbmRleExvY2FsXS5zZXRTdGF0dXMoJ2N1cnJlbnQnKTtcbiAgICAgICAgdmFyIG5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKSxcbiAgICAgICAgICAgIHByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKTtcbiAgICAgICAgaWYgKG5leHRJbmRleCAhPT0gY3VycmVudEluZGV4TG9jYWwpIHtcbiAgICAgICAgICAgIHNsaWRlc1tuZXh0SW5kZXhdLnNldFN0YXR1cygnbmV4dCcpO1xuICAgICAgICAgICAgdmFyIG5leHROZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChuZXh0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHROZXh0SW5kZXggIT09IG5leHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1tuZXh0TmV4dEluZGV4XS5zZXRTdGF0dXMoJ25leHQtbmV4dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2SW5kZXggIT09IGN1cnJlbnRJbmRleExvY2FsKSB7XG4gICAgICAgICAgICBzbGlkZXNbcHJldkluZGV4XS5zZXRTdGF0dXMoJ3ByZXYnKTtcbiAgICAgICAgICAgIHZhciBwcmV2UHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgocHJldkluZGV4KTtcbiAgICAgICAgICAgIGlmIChwcmV2UHJldkluZGV4ICE9PSBwcmV2SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbcHJldlByZXZJbmRleF0uc2V0U3RhdHVzKCdwcmV2LXByZXYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCArIDEgPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2lkZWJhcixcbiAgICAgICAgZWxlbWVudHNMaXN0LFxuICAgICAgICBHb3Rvc2xpZGUgPSByZXF1aXJlKCcuL2dvdG9zbGlkZScpLFxuICAgICAgICBQcmVzZW50YXRpb25Db25uZWN0b3IgPSByZXF1aXJlKCcuL3ByZXNlbnRhdGlvbi1jb25uZWN0b3InKSxcbiAgICAgICAgZWxlbWVudHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTcGVha2VydmlldycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3NwZWFrZXJ2aWV3LycgKyBwcmVzZW50YXRpb24uZ2V0TmFtZSgpLFxuICAgICAgICAgICAgICAgIHRhcmdldDogJ19ibGFuaycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNjcmVlbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdHbyB0byBzbGlkZScsXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBuZWVkcyB0byBiZWNvbWUgbW9yZSBnZW5lcmljXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBuZXcgR290b3NsaWRlKHByZXNlbnRhdGlvbikudG9nZ2xlLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1zZWFyY2gnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnQ29ubmVjdCB0byBzZXNzaW9uJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246IG5ldyBQcmVzZW50YXRpb25Db25uZWN0b3IocHJlc2VudGF0aW9uKS50b2dnbGUsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLWRpc2Nvbm5lY3RlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdCcm93c2UgUHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3ByZXNlbnRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1tZW51J1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2V0QmFzZUVsZW1lbnRzKCk7XG4gICAgICAgIHNldEVsZW1lbnRzKCk7XG4gICAgICAgIHNldExpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0QmFzZUVsZW1lbnRzKCkge1xuICAgICAgICBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcbiAgICAgICAgc2lkZWJhci5pZCA9ICdzaWRlYmFyJztcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKCdzaWRlYmFyJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2lkZWJhcik7XG4gICAgICAgIHZhciBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gICAgICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIGFuY2hvci5ocmVmID0gJy8nO1xuICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChhbmNob3IpO1xuICAgICAgICBsYWJlbC5jbGFzc0xpc3QuYWRkKCdsYWJlbCcsICdpY29uLXByZXNlbnRyJyk7XG4gICAgICAgIGFuY2hvci5pbm5lckhUTUwgPSAncHJlc2VudHInO1xuICAgICAgICBzaWRlYmFyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRFbGVtZW50cygpIHtcbiAgICAgICAgZWxlbWVudHNMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChlbGVtZW50c0xpc3QpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICAgICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLmFwcGVuZENoaWxkKGFuY2hvcik7XG4gICAgICAgICAgICBhbmNob3IuaW5uZXJIVE1MID0gZWxlbWVudHNbaV0ubGFiZWw7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmFjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuaHJlZiA9IGVsZW1lbnRzW2ldLmFjdGlvbjtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLnRhcmdldCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yLnRhcmdldCA9IGVsZW1lbnRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFuY2hvci5ocmVmID0gJyc7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZWxlbWVudHNbaV0uYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0uY2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmNsYXNzTGlzdC5hZGQoZWxlbWVudHNbaV0uY2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudHNMaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldExpc3RlbmVyKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGhvdEtleSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaG90S2V5KGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSA3Nykge1xuICAgICAgICAgICAgZXhwb3J0cy50b2dnbGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzaWRlYmFyLmNsYXNzTGlzdC5jb250YWlucygnb3BlbicpKSB7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLm9wZW4oKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKCdvcGVuJyk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XG4gICAgfTtcblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNsaWRlRWxlbWVudCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBjdXJyZW50U3RhdHVzID0ge30sXG4gICAgICAgIGhlYWRsaW5lO1xuXG4gICAgZXhwb3J0cy5zZXRTdGF0dXMgPSBmdW5jdGlvbihzdGF0dXMpIHtcbiAgICAgICAgc2xpZGVFbGVtZW50LmNsYXNzTGlzdC5hZGQoc3RhdHVzKTtcbiAgICAgICAgY3VycmVudFN0YXR1c1tzdGF0dXNdID0gc3RhdHVzO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNsZWFyU3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIHN0YXR1cyBpbiBjdXJyZW50U3RhdHVzKSB7XG4gICAgICAgICAgICBzbGlkZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShzdGF0dXMpO1xuICAgICAgICAgICAgZGVsZXRlIGN1cnJlbnRTdGF0dXNbc3RhdHVzXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLmdldEhlYWRsaW5lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaGVhZGxpbmUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIgc2VhcmNoID0gc2xpZGVFbGVtZW50LmlubmVySFRNTC5tYXRjaCgvPGgxLio+KC4qKTxcXC9oMT4vKTtcbiAgICAgICAgICAgIGhlYWRsaW5lID0gc2VhcmNoWzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoZWFkbGluZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXREb21Ob2RlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzbGlkZUVsZW1lbnQ7XG4gICAgfTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJ2YXIgcHJlc2VudGF0aW9ucyA9IFtdO1xuXG5leHBvcnRzLnJlZ2lzdGVyUHJlc2VudGF0aW9uID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgcHJlc2VudGF0aW9ucy5hZGQocHJlc2VudGF0aW9uKTtcbn07XG5cbmV4cG9ydHMuc2V0UmF0aW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgYXNwZWN0UmF0aW8gPSA0LzM7XG4gICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVySGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIH1cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5mb250U2l6ZSA9IChoZWlnaHQgKiAwLjAwMikgKyAnZW0nO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4oZnVuY3Rpb24gYnJvd3NlcmlmeVNoaW0obW9kdWxlLCBleHBvcnRzLCBkZWZpbmUsIGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKSB7XG4hKGZ1bmN0aW9uKG1vZHVsZU5hbWUsIGRlZmluaXRpb24pIHtcbiAgLy8gV2hldGhlciB0byBleHBvc2UgRHJhZ2dhYmxlIGFzIGFuIEFNRCBtb2R1bGUgb3IgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pO1xuICBlbHNlIHRoaXNbbW9kdWxlTmFtZV0gPSBkZWZpbml0aW9uKCk7XG5cbn0pKCdkcmFnZ2FibGUnLCBmdW5jdGlvbiBkZWZpbml0aW9uKCkge1xuICB2YXIgY3VycmVudEVsZW1lbnQ7XG4gIHZhciBmYWlybHlIaWdoWkluZGV4ID0gJzEwJztcblxuICBmdW5jdGlvbiBkcmFnZ2FibGUoZWxlbWVudCwgaGFuZGxlKSB7XG4gICAgaGFuZGxlID0gaGFuZGxlIHx8IGVsZW1lbnQ7XG4gICAgc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpO1xuICAgIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KTtcbiAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHN0YXJ0RHJhZ2dpbmcoZXZlbnQsIGVsZW1lbnQpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0UG9zaXRpb25UeXBlKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldERyYWdnYWJsZUxpc3RlbmVycyhlbGVtZW50KSB7XG4gICAgZWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnMgPSB7XG4gICAgICBzdGFydDogW10sXG4gICAgICBkcmFnOiBbXSxcbiAgICAgIHN0b3A6IFtdXG4gICAgfTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RhcnRzID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ3N0YXJ0Jyk7XG4gICAgZWxlbWVudC53aGVuRHJhZ2dpbmcgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnZHJhZycpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdTdG9wcyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdG9wJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KSB7XG4gICAgY3VycmVudEVsZW1lbnQgJiYgc2VuZFRvQmFjayhjdXJyZW50RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQgPSBicmluZ1RvRnJvbnQoZWxlbWVudCk7XG5cblxuICAgIHZhciBpbml0aWFsUG9zaXRpb24gPSBnZXRJbml0aWFsUG9zaXRpb24oY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLmxlZnQgPSBpblBpeGVscyhpbml0aWFsUG9zaXRpb24ubGVmdCk7XG4gICAgY3VycmVudEVsZW1lbnQuc3R5bGUudG9wID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLnRvcCk7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB2YXIgb2tUb0dvT24gPSB0cmlnZ2VyRXZlbnQoJ3N0YXJ0JywgeyB4OiBpbml0aWFsUG9zaXRpb24ubGVmdCwgeTogaW5pdGlhbFBvc2l0aW9uLnRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gICAgaWYgKCFva1RvR29PbikgcmV0dXJuO1xuXG4gICAgYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGVsZW1lbnQsIHR5cGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQodHlwZSwgYXJncykge1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBjdXJyZW50RWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnNbdHlwZV07XG4gICAgZm9yICh2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXShhcmdzKSA9PT0gZmFsc2UpIHJlc3VsdCA9IGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRUb0JhY2soZWxlbWVudCkge1xuICAgIHZhciBkZWNyZWFzZWRaSW5kZXggPSBmYWlybHlIaWdoWkluZGV4IC0gMTtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBkZWNyZWFzZWRaSW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiBicmluZ1RvRnJvbnQoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGVbJ3otaW5kZXgnXSA9IGZhaXJseUhpZ2haSW5kZXg7XG4gICAgZWxlbWVudC5zdHlsZVsnekluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkRG9jdW1lbnRMaXN0ZW5lcnMoKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbik7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVwb3NpdGlvbkVsZW1lbnQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCByZW1vdmVEb2N1bWVudExpc3RlbmVycyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJbml0aWFsUG9zaXRpb24oZWxlbWVudCkge1xuICAgIHZhciB0b3AgPSAwO1xuICAgIHZhciBsZWZ0ID0gMDtcbiAgICB2YXIgY3VycmVudEVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGRvIHtcbiAgICAgIHRvcCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICBsZWZ0ICs9IGN1cnJlbnRFbGVtZW50Lm9mZnNldExlZnQ7XG4gICAgfSB3aGlsZSAoY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5vZmZzZXRQYXJlbnQpO1xuXG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlPyBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIDogZmFsc2U7XG4gICAgaWYgKGNvbXB1dGVkU3R5bGUpIHtcbiAgICAgIGxlZnQgPSBsZWZ0IC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi1sZWZ0J10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci1sZWZ0J10pIHx8IDApO1xuICAgICAgdG9wID0gdG9wIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ21hcmdpbi10b3AnXSkgfHwgMCkgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnYm9yZGVyLXRvcCddKSB8fCAwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiB0b3AsXG4gICAgICBsZWZ0OiBsZWZ0XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluUGl4ZWxzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICsgJ3B4JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQgJiYgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24gJiYgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZXBvc2l0aW9uRWxlbWVudChldmVudCkge1xuICAgIHZhciBzdHlsZSA9IGN1cnJlbnRFbGVtZW50LnN0eWxlO1xuICAgIHZhciBlbGVtZW50WFBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciBlbGVtZW50WVBvc2l0aW9uID0gcGFyc2VJbnQoc3R5bGUudG9wLCAxMCk7XG5cbiAgICB2YXIgZWxlbWVudE5ld1hQb3NpdGlvbiA9IGVsZW1lbnRYUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WCAtIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24pO1xuICAgIHZhciBlbGVtZW50TmV3WVBvc2l0aW9uID0gZWxlbWVudFlQb3NpdGlvbiArIChldmVudC5jbGllbnRZIC0gY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbik7XG5cbiAgICBzdHlsZS5sZWZ0ID0gaW5QaXhlbHMoZWxlbWVudE5ld1hQb3NpdGlvbik7XG4gICAgc3R5bGUudG9wID0gaW5QaXhlbHMoZWxlbWVudE5ld1lQb3NpdGlvbik7XG5cbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uID0gZXZlbnQuY2xpZW50WDtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uID0gZXZlbnQuY2xpZW50WTtcblxuICAgIHRyaWdnZXJFdmVudCgnZHJhZycsIHsgeDogZWxlbWVudE5ld1hQb3NpdGlvbiwgeTogZWxlbWVudE5ld1lQb3NpdGlvbiwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVEb2N1bWVudExpc3RlbmVycyhldmVudCkge1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuXG4gICAgdmFyIGxlZnQgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0LCAxMCk7XG4gICAgdmFyIHRvcCA9IHBhcnNlSW50KGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCwgMTApO1xuICAgIHRyaWdnZXJFdmVudCgnc3RvcCcsIHsgeDogbGVmdCwgeTogdG9wLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgfVxuXG4gIHJldHVybiBkcmFnZ2FibGU7XG59KTtcbjsgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18odHlwZW9mIGRyYWdnYWJsZSAhPSBcInVuZGVmaW5lZFwiID8gZHJhZ2dhYmxlIDogd2luZG93LmRyYWdnYWJsZSk7XG5cbn0pLmNhbGwoZ2xvYmFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
