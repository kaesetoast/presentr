(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(document, presentation) {
    'use strict';

    var keys = {
            37: 'left',
            39: 'right',
            38: 'up',
            40: 'down',
            32: 'space'
        },
        actions = {
            next: ['right', 'space', 'up'],
            prev: ['left','down']
        };

    document.addEventListener('keydown', keydown);

    function keydown(e) {
        if (actions.prev.indexOf(keys[e.keyCode]) >= 0) {
            presentation.prev();
        } else if (actions.next.indexOf(keys[e.keyCode]) >= 0) {
            presentation.next();
        }
    }

};
},{}],2:[function(require,module,exports){
var draggable = require('draggable'),
    currentView = window.frames['current-view'],
    nextView = window.frames['next-view'],
    timer = require('./timer'),
    controls = require('./controls');
draggable(document.getElementById('current-view'));
draggable(document.getElementById('next-view'));
draggable(document.getElementById('toolbox'));

currentView.document.addEventListener('DOMContentLoaded', function() {
    currentView.presentation.connect();
    new controls(document, currentView.presentation);
});

nextView.document.addEventListener('DOMContentLoaded', function() {
    nextView.presentation.connect();
});

new timer(document.getElementById('toolbox'), parseInt(document.body.getAttribute('data-duration')));
},{"./controls":1,"./timer":3,"draggable":4}],3:[function(require,module,exports){
module.exports = function(container, endTime) {
    'use strict';
    var exports = {},
        timer,
        timeBox,
        toggleButton,
        resetButton,
        totalSeconds = 0,
        interval = null;

    function init() {
        timer = document.createElement('div');
        timeBox = document.createElement('span');
        timeBox.classList.add('time-box');
        container.appendChild(timer);
        timer.appendChild(timeBox);
        toggleButton = document.createElement('a');
        toggleButton.classList.add('toggle-button', 'icon', 'icon-play');
        timer.appendChild(toggleButton);
        toggleButton.addEventListener('click', toggleClick);
        resetButton = document.createElement('a');
        resetButton.classList.add('reset-button', 'icon', 'icon-reset');
        timer.appendChild(resetButton);
        resetButton.addEventListener('click', resetClick);
        updateTimeBox();
    }

    function updateTimeBox() {
        var seconds = totalSeconds % 60,
            minutes = parseInt(totalSeconds / 60),
            hours = parseInt(totalSeconds / 3600);
        seconds = seconds > 9 ? seconds : '0' + seconds;
        minutes = minutes > 9 ? minutes : '0' + minutes;
        hours = hours > 9 ? hours : '0' + hours;
        timeBox.innerHTML = hours + ':' +  minutes + ':' + seconds;
        if (totalSeconds + 60 > endTime && !timeBox.classList.contains('lastminute')) {
            timeBox.classList.add('lastminute');
        }
        if (totalSeconds > endTime && !timeBox.classList.contains('overtime')) {
            timeBox.classList.add('overtime');
        }
    }

    function tick() {
        totalSeconds++;
        updateTimeBox();
    }

    function resetClick(e) {
        e.preventDefault();
        exports.reset();
    }

    function toggleClick(e) {
        e.preventDefault();
        if (interval === null) {
            exports.start();
        } else {
            exports.pause();
        }
    }

    exports.start = function() {
        interval = setInterval(tick, 1000);
        toggleButton.classList.remove('icon-play');
        toggleButton.classList.add('icon-pause');
    };

    exports.pause = function() {
        clearInterval(interval);
        interval = null;
        toggleButton.classList.remove('icon-pause');
        toggleButton.classList.add('icon-play');
    };

    exports.reset = function() {
        exports.pause();
        totalSeconds = 0;
        updateTimeBox();
    };

    init();

    return exports;
};
},{}],4:[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
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

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2NvbnRyb2xzLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3NwZWFrZXJ2aWV3LmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3RpbWVyLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY29tcG9uZW50cy9kcmFnZ2FibGUvZHJhZ2dhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkb2N1bWVudCwgcHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGtleXMgPSB7XG4gICAgICAgICAgICAzNzogJ2xlZnQnLFxuICAgICAgICAgICAgMzk6ICdyaWdodCcsXG4gICAgICAgICAgICAzODogJ3VwJyxcbiAgICAgICAgICAgIDQwOiAnZG93bicsXG4gICAgICAgICAgICAzMjogJ3NwYWNlJ1xuICAgICAgICB9LFxuICAgICAgICBhY3Rpb25zID0ge1xuICAgICAgICAgICAgbmV4dDogWydyaWdodCcsICdzcGFjZScsICd1cCddLFxuICAgICAgICAgICAgcHJldjogWydsZWZ0JywnZG93biddXG4gICAgICAgIH07XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG5cbiAgICBmdW5jdGlvbiBrZXlkb3duKGUpIHtcbiAgICAgICAgaWYgKGFjdGlvbnMucHJldi5pbmRleE9mKGtleXNbZS5rZXlDb2RlXSkgPj0gMCkge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25zLm5leHQuaW5kZXhPZihrZXlzW2Uua2V5Q29kZV0pID49IDApIHtcbiAgICAgICAgICAgIHByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwidmFyIGRyYWdnYWJsZSA9IHJlcXVpcmUoJ2RyYWdnYWJsZScpLFxuICAgIGN1cnJlbnRWaWV3ID0gd2luZG93LmZyYW1lc1snY3VycmVudC12aWV3J10sXG4gICAgbmV4dFZpZXcgPSB3aW5kb3cuZnJhbWVzWyduZXh0LXZpZXcnXSxcbiAgICB0aW1lciA9IHJlcXVpcmUoJy4vdGltZXInKSxcbiAgICBjb250cm9scyA9IHJlcXVpcmUoJy4vY29udHJvbHMnKTtcbmRyYWdnYWJsZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudC12aWV3JykpO1xuZHJhZ2dhYmxlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXZpZXcnKSk7XG5kcmFnZ2FibGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rvb2xib3gnKSk7XG5cbmN1cnJlbnRWaWV3LmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgICBjdXJyZW50Vmlldy5wcmVzZW50YXRpb24uY29ubmVjdCgpO1xuICAgIG5ldyBjb250cm9scyhkb2N1bWVudCwgY3VycmVudFZpZXcucHJlc2VudGF0aW9uKTtcbn0pO1xuXG5uZXh0Vmlldy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgbmV4dFZpZXcucHJlc2VudGF0aW9uLmNvbm5lY3QoKTtcbn0pO1xuXG5uZXcgdGltZXIoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rvb2xib3gnKSwgcGFyc2VJbnQoZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtZHVyYXRpb24nKSkpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY29udGFpbmVyLCBlbmRUaW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIHRpbWVyLFxuICAgICAgICB0aW1lQm94LFxuICAgICAgICB0b2dnbGVCdXR0b24sXG4gICAgICAgIHJlc2V0QnV0dG9uLFxuICAgICAgICB0b3RhbFNlY29uZHMgPSAwLFxuICAgICAgICBpbnRlcnZhbCA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICB0aW1lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aW1lQm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB0aW1lQm94LmNsYXNzTGlzdC5hZGQoJ3RpbWUtYm94Jyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aW1lcik7XG4gICAgICAgIHRpbWVyLmFwcGVuZENoaWxkKHRpbWVCb3gpO1xuICAgICAgICB0b2dnbGVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCd0b2dnbGUtYnV0dG9uJywgJ2ljb24nLCAnaWNvbi1wbGF5Jyk7XG4gICAgICAgIHRpbWVyLmFwcGVuZENoaWxkKHRvZ2dsZUJ1dHRvbik7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZUNsaWNrKTtcbiAgICAgICAgcmVzZXRCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHJlc2V0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3Jlc2V0LWJ1dHRvbicsICdpY29uJywgJ2ljb24tcmVzZXQnKTtcbiAgICAgICAgdGltZXIuYXBwZW5kQ2hpbGQocmVzZXRCdXR0b24pO1xuICAgICAgICByZXNldEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHJlc2V0Q2xpY2spO1xuICAgICAgICB1cGRhdGVUaW1lQm94KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlVGltZUJveCgpIHtcbiAgICAgICAgdmFyIHNlY29uZHMgPSB0b3RhbFNlY29uZHMgJSA2MCxcbiAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludCh0b3RhbFNlY29uZHMgLyA2MCksXG4gICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHRvdGFsU2Vjb25kcyAvIDM2MDApO1xuICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyA+IDkgPyBzZWNvbmRzIDogJzAnICsgc2Vjb25kcztcbiAgICAgICAgbWludXRlcyA9IG1pbnV0ZXMgPiA5ID8gbWludXRlcyA6ICcwJyArIG1pbnV0ZXM7XG4gICAgICAgIGhvdXJzID0gaG91cnMgPiA5ID8gaG91cnMgOiAnMCcgKyBob3VycztcbiAgICAgICAgdGltZUJveC5pbm5lckhUTUwgPSBob3VycyArICc6JyArICBtaW51dGVzICsgJzonICsgc2Vjb25kcztcbiAgICAgICAgaWYgKHRvdGFsU2Vjb25kcyArIDYwID4gZW5kVGltZSAmJiAhdGltZUJveC5jbGFzc0xpc3QuY29udGFpbnMoJ2xhc3RtaW51dGUnKSkge1xuICAgICAgICAgICAgdGltZUJveC5jbGFzc0xpc3QuYWRkKCdsYXN0bWludXRlJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvdGFsU2Vjb25kcyA+IGVuZFRpbWUgJiYgIXRpbWVCb3guY2xhc3NMaXN0LmNvbnRhaW5zKCdvdmVydGltZScpKSB7XG4gICAgICAgICAgICB0aW1lQm94LmNsYXNzTGlzdC5hZGQoJ292ZXJ0aW1lJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aWNrKCkge1xuICAgICAgICB0b3RhbFNlY29uZHMrKztcbiAgICAgICAgdXBkYXRlVGltZUJveCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0Q2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV4cG9ydHMucmVzZXQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKGludGVydmFsID09PSBudWxsKSB7XG4gICAgICAgICAgICBleHBvcnRzLnN0YXJ0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLnBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwodGljaywgMTAwMCk7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdpY29uLXBsYXknKTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2ljb24tcGF1c2UnKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgaW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0b2dnbGVCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnaWNvbi1wYXVzZScpO1xuICAgICAgICB0b2dnbGVCdXR0b24uY2xhc3NMaXN0LmFkZCgnaWNvbi1wbGF5Jyk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwb3J0cy5wYXVzZSgpO1xuICAgICAgICB0b3RhbFNlY29uZHMgPSAwO1xuICAgICAgICB1cGRhdGVUaW1lQm94KCk7XG4gICAgfTtcblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG47X19icm93c2VyaWZ5X3NoaW1fcmVxdWlyZV9fPXJlcXVpcmU7KGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgcmVxdWlyZSwgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuIShmdW5jdGlvbihtb2R1bGVOYW1lLCBkZWZpbml0aW9uKSB7XG4gIC8vIFdoZXRoZXIgdG8gZXhwb3NlIERyYWdnYWJsZSBhcyBhbiBBTUQgbW9kdWxlIG9yIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW21vZHVsZU5hbWVdID0gZGVmaW5pdGlvbigpO1xuXG59KSgnZHJhZ2dhYmxlJywgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuICB2YXIgZmFpcmx5SGlnaFpJbmRleCA9ICcxMCc7XG5cbiAgZnVuY3Rpb24gZHJhZ2dhYmxlKGVsZW1lbnQsIGhhbmRsZSkge1xuICAgIGhhbmRsZSA9IGhhbmRsZSB8fCBlbGVtZW50O1xuICAgIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KTtcbiAgICBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzID0ge1xuICAgICAgc3RhcnQ6IFtdLFxuICAgICAgZHJhZzogW10sXG4gICAgICBzdG9wOiBbXVxuICAgIH07XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0YXJ0cyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdGFydCcpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdnaW5nID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ2RyYWcnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RvcHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RvcCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCkge1xuICAgIGN1cnJlbnRFbGVtZW50ICYmIHNlbmRUb0JhY2soY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gYnJpbmdUb0Zyb250KGVsZW1lbnQpO1xuXG5cbiAgICB2YXIgaW5pdGlhbFBvc2l0aW9uID0gZ2V0SW5pdGlhbFBvc2l0aW9uKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLmxlZnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi50b3ApO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdmFyIG9rVG9Hb09uID0gdHJpZ2dlckV2ZW50KCdzdGFydCcsIHsgeDogaW5pdGlhbFBvc2l0aW9uLmxlZnQsIHk6IGluaXRpYWxQb3NpdGlvbi50b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICAgIGlmICghb2tUb0dvT24pIHJldHVybjtcblxuICAgIGFkZERvY3VtZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihlbGVtZW50LCB0eXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGFyZ3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gY3VycmVudEVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0oYXJncykgPT09IGZhbHNlKSByZXN1bHQgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9CYWNrKGVsZW1lbnQpIHtcbiAgICB2YXIgZGVjcmVhc2VkWkluZGV4ID0gZmFpcmx5SGlnaFpJbmRleCAtIDE7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gYnJpbmdUb0Zyb250KGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZERvY3VtZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5pdGlhbFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdG9wID0gMDtcbiAgICB2YXIgbGVmdCA9IDA7XG4gICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICBkbyB7XG4gICAgICB0b3AgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgbGVmdCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIH0gd2hpbGUgKGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQub2Zmc2V0UGFyZW50KTtcblxuICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZT8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IGZhbHNlO1xuICAgIGlmIChjb21wdXRlZFN0eWxlKSB7XG4gICAgICBsZWZ0ID0gbGVmdCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tbGVmdCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItbGVmdCddKSB8fCAwKTtcbiAgICAgIHRvcCA9IHRvcCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tdG9wJ10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci10b3AnXSkgfHwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogdG9wLFxuICAgICAgbGVmdDogbGVmdFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBpblBpeGVscyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3NpdGlvbkVsZW1lbnQoZXZlbnQpIHtcbiAgICB2YXIgc3R5bGUgPSBjdXJyZW50RWxlbWVudC5zdHlsZTtcbiAgICB2YXIgZWxlbWVudFhQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgZWxlbWVudFlQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLnRvcCwgMTApO1xuXG4gICAgdmFyIGVsZW1lbnROZXdYUG9zaXRpb24gPSBlbGVtZW50WFBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFggLSBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uKTtcbiAgICB2YXIgZWxlbWVudE5ld1lQb3NpdGlvbiA9IGVsZW1lbnRZUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WSAtIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24pO1xuXG4gICAgc3R5bGUubGVmdCA9IGluUGl4ZWxzKGVsZW1lbnROZXdYUG9zaXRpb24pO1xuICAgIHN0eWxlLnRvcCA9IGluUGl4ZWxzKGVsZW1lbnROZXdZUG9zaXRpb24pO1xuXG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2RyYWcnLCB7IHg6IGVsZW1lbnROZXdYUG9zaXRpb24sIHk6IGVsZW1lbnROZXdZUG9zaXRpb24sIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcblxuICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciB0b3AgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS50b3AsIDEwKTtcbiAgICB0cmlnZ2VyRXZlbnQoJ3N0b3AnLCB7IHg6IGxlZnQsIHk6IHRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICByZXR1cm4gZHJhZ2dhYmxlO1xufSk7XG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkcmFnZ2FibGUgIT0gXCJ1bmRlZmluZWRcIiA/IGRyYWdnYWJsZSA6IHdpbmRvdy5kcmFnZ2FibGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmdW5jdGlvbiBkZWZpbmVFeHBvcnQoZXgpIHsgbW9kdWxlLmV4cG9ydHMgPSBleDsgfSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
