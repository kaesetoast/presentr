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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLWNvbm5lY3Rvci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvc2lkZWJhci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9zbGlkZS5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC92aWV3cG9ydC1vYnNlcnZlci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NvbXBvbmVudHMvZHJhZ2dhYmxlL2RyYWdnYWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHByZXNlbnRhdGlvbk1vZHVsZSA9IHJlcXVpcmUoJy4vcHJlc2VudGF0aW9uJyksXG4gICAgdmlld3BvcnRPYnNlcnZlciA9IHJlcXVpcmUoJy4vdmlld3BvcnQtb2JzZXJ2ZXInKSxcbiAgICBzaWRlYmFyID0gcmVxdWlyZSgnLi9zaWRlYmFyJyksXG4gICAgcHJlc2VudGF0aW9uTmFtZSA9IGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLXByZXNlbnRhdGlvbicpLFxuICAgIGlzUHJldmlld0RlY2sgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCcvcHJldmlldycsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmxlbmd0aCAtIDgpID4gMDtcblxud2luZG93LnByZXNlbnRhdGlvbiA9IG5ldyBwcmVzZW50YXRpb25Nb2R1bGUoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2xpZGUnKSwgcHJlc2VudGF0aW9uTmFtZSwgaXNQcmV2aWV3RGVjayk7XG5uZXcgc2lkZWJhcih3aW5kb3cucHJlc2VudGF0aW9uKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMzcpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5wcmV2KCk7XG4gICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT09IDM5KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ubmV4dCgpO1xuICAgIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbyk7XG52aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2VhcmNoV3JhcHBlcixcbiAgICAgICAgc2VhcmNoSW5wdXQsXG4gICAgICAgIHNsaWRlSGVhZGxpbmUsXG4gICAgICAgIGlzT3BlbiA9IGZhbHNlLFxuICAgICAgICBzbGlkZXM7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzbGlkZXMgPSBwcmVzZW50YXRpb24uZ2V0U2xpZGVzKCk7XG4gICAgICAgIHNldEJhc2VFbGVtZW50cygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJhc2VFbGVtZW50cygpIHtcbiAgICAgICAgc2VhcmNoV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5jbGFzc0xpc3QuYWRkKCdnb3Rvc2xpZGUnKTtcbiAgICAgICAgc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBzZWFyY2hJbnB1dC50eXBlID0gJ251bWJlcic7XG4gICAgICAgIHNlYXJjaElucHV0Lm1pbiA9IDE7XG4gICAgICAgIHNlYXJjaElucHV0Lm1heCA9IHNsaWRlcy5sZW5ndGg7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuYXBwZW5kQ2hpbGQoc2VhcmNoSW5wdXQpO1xuICAgICAgICBzbGlkZUhlYWRsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzbGlkZUhlYWRsaW5lLmNsYXNzTGlzdC5hZGQoJ3NsaWRlLWhlYWRsaW5lJyk7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuYXBwZW5kQ2hpbGQoc2xpZGVIZWFkbGluZSk7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBnb1RvU2VsZWN0ZWRTbGlkZSk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzZWFyY2hXcmFwcGVyLCBldmVudC5jdXJyZW50VGFyZ2V0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZpcmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHNldFNsaWRlSGVhZGxpbmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBzZXRTbGlkZUhlYWRsaW5lKTtcbiAgICAgICAgc2VhcmNoSW5wdXQudmFsdWUgPSBwcmVzZW50YXRpb24uZ2V0Q3VycmVudFNsaWRlSW5kZXgoKSArIDE7XG4gICAgICAgIHNldFNsaWRlSGVhZGxpbmUoKTtcbiAgICAgICAgaXNPcGVuID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWFyY2hXcmFwcGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2VhcmNoV3JhcHBlcik7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmaXJlKTtcbiAgICAgICAgaXNPcGVuID0gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKGlzT3Blbikge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZShldmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLm9wZW4oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlSGVhZGxpbmUoKSB7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUuaW5uZXJIVE1MID0gc2xpZGVzW3NlYXJjaElucHV0LnZhbHVlIC0gMV0uZ2V0SGVhZGxpbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnb1RvU2VsZWN0ZWRTbGlkZSgpIHtcbiAgICAgICAgcHJlc2VudGF0aW9uLmdvVG8oc2VhcmNoSW5wdXQudmFsdWUgLSAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgZ29Ub1NlbGVjdGVkU2xpZGUoKTtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge307XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChwcmVzZW50YXRpb24uaXNDb25uZWN0ZWQoKSkge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnaWNvbi1jb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmFkZCgnaWNvbi1kaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gJ0Nvbm5lY3QgdG8gc2Vzc2lvbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVzZW50YXRpb24uY29ubmVjdCgpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdpY29uLWRpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKCdpY29uLWNvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5pbm5lckhUTUwgPSAnRGlzY29ubmVjdCBmcm9tIHNlc3Npb24nO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNsaWRlRWxlbWVudHMsIG5hbWUsIGlzUHJldmlld0RlY2spIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudEluZGV4ID0gMCxcbiAgICAgICAgc29ja2V0LFxuICAgICAgICBTbGlkZSA9IHJlcXVpcmUoJy4vc2xpZGUnKSxcbiAgICAgICAgc2xpZGVzID0gW107XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBpbml0U2xpZGVzKCk7XG4gICAgICAgIGlmIChpc1ByZXZpZXdEZWNrKSB7XG4gICAgICAgICAgICBhZGRFbmRTbGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaGFzaCAhPT0gJycpIHtcbiAgICAgICAgICAgIGhhc2hDaGFuZ2VkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLmdvVG8oMCk7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBoYXNoQ2hhbmdlZCk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5wcmV2ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXRDdXJyZW50U2xpZGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudEluZGV4O1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdvVG8gPSBmdW5jdGlvbihzbGlkZUluZGV4LCByZW1vdGVJbnZva2VkKSB7XG4gICAgICAgIGlmIChzbGlkZXMubGVuZ3RoID4gc2xpZGVJbmRleCkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdGVJbnZva2VkICYmIHR5cGVvZiBzb2NrZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ2dvdG8tc2xpZGUnLCB7cHJlc2VudGF0aW9uTmFtZTogbmFtZSwgc2xpZGU6IHNsaWRlSW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlSW5kZXg7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLmdldFNsaWRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2xpZGVzO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBzb2NrZXQgIT09ICd1bmRlZmluZWQnICYmIHNvY2tldC5zb2NrZXQuY29ubmVjdGVkO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb2NrZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgICBzb2NrZXQub24oJ2dvdG8tc2xpZGUnLCBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgICAgICBleHBvcnRzLmdvVG8oZGF0YSwgdHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvY2tldC5zb2NrZXQuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIHNvY2tldC5lbWl0KCdyZWdpc3RlcicsIHtwcmVzZW50YXRpb246IG5hbWV9KTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvY2tldC5kaXNjb25uZWN0KCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGluaXRTbGlkZXMoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpZGVFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2xpZGVzLnB1c2gobmV3IFNsaWRlKHNsaWRlRWxlbWVudHNbaV0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc2hDaGFuZ2VkKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8ocGFyc2VJbnQod2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKSAtIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZEVuZFNsaWRlKCkge1xuICAgICAgICB2YXIgYXJ0aWNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FydGljbGUnKTtcbiAgICAgICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdzbGlkZScsICdlbmQnKTtcbiAgICAgICAgc2xpZGVzW3NsaWRlcy5sZW5ndGgtMV0uZ2V0RG9tTm9kZSgpLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGFydGljbGUsIHNsaWRlc1tzbGlkZXMubGVuZ3RoLTFdLm5leHRTaWJsaW5nKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRTbGlkZXMoKSB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXhMb2NhbCA9IGlzUHJldmlld0RlY2sgPyAoY3VycmVudEluZGV4ICsgMSkgOiBjdXJyZW50SW5kZXg7XG4gICAgICAgIGZvciAodmFyIGkgPSBzbGlkZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHNsaWRlc1tpXS5jbGVhclN0YXR1cygpO1xuICAgICAgICB9XG4gICAgICAgIHNsaWRlc1tjdXJyZW50SW5kZXhMb2NhbF0uc2V0U3RhdHVzKCdjdXJyZW50Jyk7XG4gICAgICAgIHZhciBuZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXhMb2NhbCksXG4gICAgICAgICAgICBwcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXhMb2NhbCk7XG4gICAgICAgIGlmIChuZXh0SW5kZXggIT09IGN1cnJlbnRJbmRleExvY2FsKSB7XG4gICAgICAgICAgICBzbGlkZXNbbmV4dEluZGV4XS5zZXRTdGF0dXMoJ25leHQnKTtcbiAgICAgICAgICAgIHZhciBuZXh0TmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgobmV4dEluZGV4KTtcbiAgICAgICAgICAgIGlmIChuZXh0TmV4dEluZGV4ICE9PSBuZXh0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbbmV4dE5leHRJbmRleF0uc2V0U3RhdHVzKCduZXh0LW5leHQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJldkluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW3ByZXZJbmRleF0uc2V0U3RhdHVzKCdwcmV2Jyk7XG4gICAgICAgICAgICB2YXIgcHJldlByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KHByZXZJbmRleCk7XG4gICAgICAgICAgICBpZiAocHJldlByZXZJbmRleCAhPT0gcHJldkluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW3ByZXZQcmV2SW5kZXhdLnNldFN0YXR1cygncHJldi1wcmV2Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggKyAxID49IHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzbGlkZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50U2xpZGVJbmRleCkge1xuICAgICAgICBpZiAoY3VycmVudFNsaWRlSW5kZXggPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIHNpZGViYXIsXG4gICAgICAgIGVsZW1lbnRzTGlzdCxcbiAgICAgICAgR290b3NsaWRlID0gcmVxdWlyZSgnLi9nb3Rvc2xpZGUnKSxcbiAgICAgICAgUHJlc2VudGF0aW9uQ29ubmVjdG9yID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24tY29ubmVjdG9yJyksXG4gICAgICAgIGVsZW1lbnRzID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnU3BlYWtlcnZpZXcnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJy9zcGVha2Vydmlldy8nICsgcHJlc2VudGF0aW9uLmdldE5hbWUoKSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdfYmxhbmsnLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1zY3JlZW4nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnR28gdG8gc2xpZGUnLFxuICAgICAgICAgICAgICAgIC8vIFRoaXMgbmVlZHMgdG8gYmVjb21lIG1vcmUgZ2VuZXJpY1xuICAgICAgICAgICAgICAgIGFjdGlvbjogbmV3IEdvdG9zbGlkZShwcmVzZW50YXRpb24pLnRvZ2dsZSxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tc2VhcmNoJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0Nvbm5lY3QgdG8gc2Vzc2lvbicsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBuZXcgUHJlc2VudGF0aW9uQ29ubmVjdG9yKHByZXNlbnRhdGlvbikudG9nZ2xlLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1kaXNjb25uZWN0ZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnQnJvd3NlIFByZXNlbnRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJy9wcmVzZW50YXRpb25zJyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tbWVudSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHNldEJhc2VFbGVtZW50cygpO1xuICAgICAgICBzZXRFbGVtZW50cygpO1xuICAgICAgICBzZXRMaXN0ZW5lcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJhc2VFbGVtZW50cygpIHtcbiAgICAgICAgc2lkZWJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FzaWRlJyk7XG4gICAgICAgIHNpZGViYXIuaWQgPSAnc2lkZWJhcic7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnc2lkZWJhcicpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNpZGViYXIpO1xuICAgICAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICAgICAgICB2YXIgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBhbmNob3IuaHJlZiA9ICcvJztcbiAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICAgICAgbGFiZWwuY2xhc3NMaXN0LmFkZCgnbGFiZWwnLCAnaWNvbi1wcmVzZW50cicpO1xuICAgICAgICBhbmNob3IuaW5uZXJIVE1MID0gJ3ByZXNlbnRyJztcbiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0RWxlbWVudHMoKSB7XG4gICAgICAgIGVsZW1lbnRzTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgIHNpZGViYXIuYXBwZW5kQ2hpbGQoZWxlbWVudHNMaXN0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaXN0SXRlbS5hcHBlbmRDaGlsZChhbmNob3IpO1xuICAgICAgICAgICAgYW5jaG9yLmlubmVySFRNTCA9IGVsZW1lbnRzW2ldLmxhYmVsO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50c1tpXS5hY3Rpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmhyZWYgPSBlbGVtZW50c1tpXS5hY3Rpb247XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50c1tpXS50YXJnZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuY2hvci50YXJnZXQgPSBlbGVtZW50c1tpXS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuaHJlZiA9ICcnO1xuICAgICAgICAgICAgICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGVsZW1lbnRzW2ldLmFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmNsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5jbGFzc0xpc3QuYWRkKGVsZW1lbnRzW2ldLmNsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRzTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRMaXN0ZW5lcigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBob3RLZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvdEtleShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMudG9nZ2xlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnb3BlbicpO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LnJlbW92ZSgnb3BlbicpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzbGlkZUVsZW1lbnQpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudFN0YXR1cyA9IHt9LFxuICAgICAgICBoZWFkbGluZTtcblxuICAgIGV4cG9ydHMuc2V0U3RhdHVzID0gZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgIHNsaWRlRWxlbWVudC5jbGFzc0xpc3QuYWRkKHN0YXR1cyk7XG4gICAgICAgIGN1cnJlbnRTdGF0dXNbc3RhdHVzXSA9IHN0YXR1cztcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jbGVhclN0YXR1cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBzdGF0dXMgaW4gY3VycmVudFN0YXR1cykge1xuICAgICAgICAgICAgc2xpZGVFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoc3RhdHVzKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjdXJyZW50U3RhdHVzW3N0YXR1c107XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXRIZWFkbGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodHlwZW9mIGhlYWRsaW5lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFyIHNlYXJjaCA9IHNsaWRlRWxlbWVudC5pbm5lckhUTUwubWF0Y2goLzxoMS4qPiguKik8XFwvaDE+Lyk7XG4gICAgICAgICAgICBoZWFkbGluZSA9IHNlYXJjaFsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGVhZGxpbmU7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0RG9tTm9kZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2xpZGVFbGVtZW50O1xuICAgIH07XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwidmFyIHByZXNlbnRhdGlvbnMgPSBbXTtcblxuZXhwb3J0cy5yZWdpc3RlclByZXNlbnRhdGlvbiA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgIHByZXNlbnRhdGlvbnMuYWRkKHByZXNlbnRhdGlvbik7XG59O1xuXG5leHBvcnRzLnNldFJhdGlvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGFzcGVjdFJhdGlvID0gNC8zO1xuICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggKiBhc3BlY3RSYXRpbztcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB9XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuZm9udFNpemUgPSAoaGVpZ2h0ICogMC4wMDIpICsgJ2VtJztcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuIShmdW5jdGlvbihtb2R1bGVOYW1lLCBkZWZpbml0aW9uKSB7XG4gIC8vIFdoZXRoZXIgdG8gZXhwb3NlIERyYWdnYWJsZSBhcyBhbiBBTUQgbW9kdWxlIG9yIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW21vZHVsZU5hbWVdID0gZGVmaW5pdGlvbigpO1xuXG59KSgnZHJhZ2dhYmxlJywgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuICB2YXIgZmFpcmx5SGlnaFpJbmRleCA9ICcxMCc7XG5cbiAgZnVuY3Rpb24gZHJhZ2dhYmxlKGVsZW1lbnQsIGhhbmRsZSkge1xuICAgIGhhbmRsZSA9IGhhbmRsZSB8fCBlbGVtZW50O1xuICAgIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KTtcbiAgICBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzID0ge1xuICAgICAgc3RhcnQ6IFtdLFxuICAgICAgZHJhZzogW10sXG4gICAgICBzdG9wOiBbXVxuICAgIH07XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0YXJ0cyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdGFydCcpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdnaW5nID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ2RyYWcnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RvcHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RvcCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCkge1xuICAgIGN1cnJlbnRFbGVtZW50ICYmIHNlbmRUb0JhY2soY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gYnJpbmdUb0Zyb250KGVsZW1lbnQpO1xuXG5cbiAgICB2YXIgaW5pdGlhbFBvc2l0aW9uID0gZ2V0SW5pdGlhbFBvc2l0aW9uKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLmxlZnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi50b3ApO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdmFyIG9rVG9Hb09uID0gdHJpZ2dlckV2ZW50KCdzdGFydCcsIHsgeDogaW5pdGlhbFBvc2l0aW9uLmxlZnQsIHk6IGluaXRpYWxQb3NpdGlvbi50b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICAgIGlmICghb2tUb0dvT24pIHJldHVybjtcblxuICAgIGFkZERvY3VtZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihlbGVtZW50LCB0eXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGFyZ3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gY3VycmVudEVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0oYXJncykgPT09IGZhbHNlKSByZXN1bHQgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9CYWNrKGVsZW1lbnQpIHtcbiAgICB2YXIgZGVjcmVhc2VkWkluZGV4ID0gZmFpcmx5SGlnaFpJbmRleCAtIDE7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gYnJpbmdUb0Zyb250KGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZERvY3VtZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5pdGlhbFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdG9wID0gMDtcbiAgICB2YXIgbGVmdCA9IDA7XG4gICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICBkbyB7XG4gICAgICB0b3AgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgbGVmdCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIH0gd2hpbGUgKGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQub2Zmc2V0UGFyZW50KTtcblxuICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZT8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IGZhbHNlO1xuICAgIGlmIChjb21wdXRlZFN0eWxlKSB7XG4gICAgICBsZWZ0ID0gbGVmdCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tbGVmdCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItbGVmdCddKSB8fCAwKTtcbiAgICAgIHRvcCA9IHRvcCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tdG9wJ10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci10b3AnXSkgfHwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogdG9wLFxuICAgICAgbGVmdDogbGVmdFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBpblBpeGVscyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3NpdGlvbkVsZW1lbnQoZXZlbnQpIHtcbiAgICB2YXIgc3R5bGUgPSBjdXJyZW50RWxlbWVudC5zdHlsZTtcbiAgICB2YXIgZWxlbWVudFhQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgZWxlbWVudFlQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLnRvcCwgMTApO1xuXG4gICAgdmFyIGVsZW1lbnROZXdYUG9zaXRpb24gPSBlbGVtZW50WFBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFggLSBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uKTtcbiAgICB2YXIgZWxlbWVudE5ld1lQb3NpdGlvbiA9IGVsZW1lbnRZUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WSAtIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24pO1xuXG4gICAgc3R5bGUubGVmdCA9IGluUGl4ZWxzKGVsZW1lbnROZXdYUG9zaXRpb24pO1xuICAgIHN0eWxlLnRvcCA9IGluUGl4ZWxzKGVsZW1lbnROZXdZUG9zaXRpb24pO1xuXG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2RyYWcnLCB7IHg6IGVsZW1lbnROZXdYUG9zaXRpb24sIHk6IGVsZW1lbnROZXdZUG9zaXRpb24sIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcblxuICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciB0b3AgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS50b3AsIDEwKTtcbiAgICB0cmlnZ2VyRXZlbnQoJ3N0b3AnLCB7IHg6IGxlZnQsIHk6IHRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICByZXR1cm4gZHJhZ2dhYmxlO1xufSk7XG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkcmFnZ2FibGUgIT0gXCJ1bmRlZmluZWRcIiA/IGRyYWdnYWJsZSA6IHdpbmRvdy5kcmFnZ2FibGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
