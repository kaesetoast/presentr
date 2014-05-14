(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var draggable = require('draggable'),
    currentView = window.frames['current-view'],
    nextView = window.frames['next-view'],
    timer = require('./timer');
draggable(document.getElementById('current-view'));
draggable(document.getElementById('next-view'));
draggable(document.getElementById('toolbox'));

currentView.document.addEventListener('DOMContentLoaded', function() {
    currentView.presentation.connect();
});

nextView.document.addEventListener('DOMContentLoaded', function() {
    nextView.presentation.connect();
});

new timer(document.getElementById('toolbox'), parseInt(document.body.getAttribute('data-duration')));
},{"./timer":2,"draggable":3}],2:[function(require,module,exports){
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
        toggleButton.innerHTML = '▶';
        toggleButton.classList.add('toggle-button');
        timer.appendChild(toggleButton);
        toggleButton.addEventListener('click', toggleClick);
        resetButton = document.createElement('a');
        resetButton.innerHTML = 'reset';
        resetButton.classList.add('reset-button');
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
        toggleButton.innerHTML = '||';
    };

    exports.pause = function() {
        clearInterval(interval);
        interval = null;
        toggleButton.innerHTML = '▶';
    };

    exports.reset = function() {
        exports.pause();
        totalSeconds = 0;
        updateTimeBox();
    };

    init();

    return exports;
};
},{}],3:[function(require,module,exports){
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3NwZWFrZXJ2aWV3LmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3RpbWVyLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY29tcG9uZW50cy9kcmFnZ2FibGUvZHJhZ2dhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZHJhZ2dhYmxlID0gcmVxdWlyZSgnZHJhZ2dhYmxlJyksXG4gICAgY3VycmVudFZpZXcgPSB3aW5kb3cuZnJhbWVzWydjdXJyZW50LXZpZXcnXSxcbiAgICBuZXh0VmlldyA9IHdpbmRvdy5mcmFtZXNbJ25leHQtdmlldyddLFxuICAgIHRpbWVyID0gcmVxdWlyZSgnLi90aW1lcicpO1xuZHJhZ2dhYmxlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW50LXZpZXcnKSk7XG5kcmFnZ2FibGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtdmlldycpKTtcbmRyYWdnYWJsZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9vbGJveCcpKTtcblxuY3VycmVudFZpZXcuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIGN1cnJlbnRWaWV3LnByZXNlbnRhdGlvbi5jb25uZWN0KCk7XG59KTtcblxubmV4dFZpZXcuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIG5leHRWaWV3LnByZXNlbnRhdGlvbi5jb25uZWN0KCk7XG59KTtcblxubmV3IHRpbWVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b29sYm94JyksIHBhcnNlSW50KGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWR1cmF0aW9uJykpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZW5kVGltZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICB0aW1lcixcbiAgICAgICAgdGltZUJveCxcbiAgICAgICAgdG9nZ2xlQnV0dG9uLFxuICAgICAgICByZXNldEJ1dHRvbixcbiAgICAgICAgdG90YWxTZWNvbmRzID0gMCxcbiAgICAgICAgaW50ZXJ2YWwgPSBudWxsO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGltZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGltZUJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGltZUJveC5jbGFzc0xpc3QuYWRkKCd0aW1lLWJveCcpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGltZXIpO1xuICAgICAgICB0aW1lci5hcHBlbmRDaGlsZCh0aW1lQm94KTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICB0b2dnbGVCdXR0b24uaW5uZXJIVE1MID0gJ+KWtic7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCd0b2dnbGUtYnV0dG9uJyk7XG4gICAgICAgIHRpbWVyLmFwcGVuZENoaWxkKHRvZ2dsZUJ1dHRvbik7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZUNsaWNrKTtcbiAgICAgICAgcmVzZXRCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHJlc2V0QnV0dG9uLmlubmVySFRNTCA9ICdyZXNldCc7XG4gICAgICAgIHJlc2V0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3Jlc2V0LWJ1dHRvbicpO1xuICAgICAgICB0aW1lci5hcHBlbmRDaGlsZChyZXNldEJ1dHRvbik7XG4gICAgICAgIHJlc2V0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVzZXRDbGljayk7XG4gICAgICAgIHVwZGF0ZVRpbWVCb3goKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVUaW1lQm94KCkge1xuICAgICAgICB2YXIgc2Vjb25kcyA9IHRvdGFsU2Vjb25kcyAlIDYwLFxuICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHRvdGFsU2Vjb25kcyAvIDYwKSxcbiAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQodG90YWxTZWNvbmRzIC8gMzYwMCk7XG4gICAgICAgIHNlY29uZHMgPSBzZWNvbmRzID4gOSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuICAgICAgICBtaW51dGVzID0gbWludXRlcyA+IDkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcbiAgICAgICAgaG91cnMgPSBob3VycyA+IDkgPyBob3VycyA6ICcwJyArIGhvdXJzO1xuICAgICAgICB0aW1lQm94LmlubmVySFRNTCA9IGhvdXJzICsgJzonICsgIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzO1xuICAgICAgICBpZiAodG90YWxTZWNvbmRzICsgNjAgPiBlbmRUaW1lICYmICF0aW1lQm94LmNsYXNzTGlzdC5jb250YWlucygnbGFzdG1pbnV0ZScpKSB7XG4gICAgICAgICAgICB0aW1lQm94LmNsYXNzTGlzdC5hZGQoJ2xhc3RtaW51dGUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG90YWxTZWNvbmRzID4gZW5kVGltZSAmJiAhdGltZUJveC5jbGFzc0xpc3QuY29udGFpbnMoJ292ZXJ0aW1lJykpIHtcbiAgICAgICAgICAgIHRpbWVCb3guY2xhc3NMaXN0LmFkZCgnb3ZlcnRpbWUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgIHRvdGFsU2Vjb25kcysrO1xuICAgICAgICB1cGRhdGVUaW1lQm94KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXRDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXhwb3J0cy5yZXNldCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvZ2dsZUNsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoaW50ZXJ2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuc3RhcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMucGF1c2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aWNrLCAxMDAwKTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmlubmVySFRNTCA9ICd8fCc7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgIGludGVydmFsID0gbnVsbDtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmlubmVySFRNTCA9ICfilrYnO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMucGF1c2UoKTtcbiAgICAgICAgdG90YWxTZWNvbmRzID0gMDtcbiAgICAgICAgdXBkYXRlVGltZUJveCgpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuO19fYnJvd3NlcmlmeV9zaGltX3JlcXVpcmVfXz1yZXF1aXJlOyhmdW5jdGlvbiBicm93c2VyaWZ5U2hpbShtb2R1bGUsIGV4cG9ydHMsIHJlcXVpcmUsIGRlZmluZSwgYnJvd3NlcmlmeV9zaGltX19kZWZpbmVfX21vZHVsZV9fZXhwb3J0X18pIHtcbiEoZnVuY3Rpb24obW9kdWxlTmFtZSwgZGVmaW5pdGlvbikge1xuICAvLyBXaGV0aGVyIHRvIGV4cG9zZSBEcmFnZ2FibGUgYXMgYW4gQU1EIG1vZHVsZSBvciB0byB0aGUgZ2xvYmFsIG9iamVjdC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnKSBkZWZpbmUoZGVmaW5pdGlvbik7XG4gIGVsc2UgdGhpc1ttb2R1bGVOYW1lXSA9IGRlZmluaXRpb24oKTtcblxufSkoJ2RyYWdnYWJsZScsIGZ1bmN0aW9uIGRlZmluaXRpb24oKSB7XG4gIHZhciBjdXJyZW50RWxlbWVudDtcbiAgdmFyIGZhaXJseUhpZ2haSW5kZXggPSAnMTAnO1xuXG4gIGZ1bmN0aW9uIGRyYWdnYWJsZShlbGVtZW50LCBoYW5kbGUpIHtcbiAgICBoYW5kbGUgPSBoYW5kbGUgfHwgZWxlbWVudDtcbiAgICBzZXRQb3NpdGlvblR5cGUoZWxlbWVudCk7XG4gICAgc2V0RHJhZ2dhYmxlTGlzdGVuZXJzKGVsZW1lbnQpO1xuICAgIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRQb3NpdGlvblR5cGUoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0RHJhZ2dhYmxlTGlzdGVuZXJzKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVycyA9IHtcbiAgICAgIHN0YXJ0OiBbXSxcbiAgICAgIGRyYWc6IFtdLFxuICAgICAgc3RvcDogW11cbiAgICB9O1xuICAgIGVsZW1lbnQud2hlbkRyYWdTdGFydHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RhcnQnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnZ2luZyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdkcmFnJyk7XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0b3BzID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ3N0b3AnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0YXJ0RHJhZ2dpbmcoZXZlbnQsIGVsZW1lbnQpIHtcbiAgICBjdXJyZW50RWxlbWVudCAmJiBzZW5kVG9CYWNrKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudCA9IGJyaW5nVG9Gcm9udChlbGVtZW50KTtcblxuXG4gICAgdmFyIGluaXRpYWxQb3NpdGlvbiA9IGdldEluaXRpYWxQb3NpdGlvbihjdXJyZW50RWxlbWVudCk7XG4gICAgY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi5sZWZ0KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS50b3AgPSBpblBpeGVscyhpbml0aWFsUG9zaXRpb24udG9wKTtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uID0gZXZlbnQuY2xpZW50WDtcbiAgICBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uID0gZXZlbnQuY2xpZW50WTtcblxuICAgIHZhciBva1RvR29PbiA9IHRyaWdnZXJFdmVudCgnc3RhcnQnLCB7IHg6IGluaXRpYWxQb3NpdGlvbi5sZWZ0LCB5OiBpbml0aWFsUG9zaXRpb24udG9wLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgICBpZiAoIW9rVG9Hb09uKSByZXR1cm47XG5cbiAgICBhZGREb2N1bWVudExpc3RlbmVycygpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZWxlbWVudCwgdHlwZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgZWxlbWVudC5kcmFnZ2FibGVMaXN0ZW5lcnNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaWdnZXJFdmVudCh0eXBlLCBhcmdzKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgdmFyIGxpc3RlbmVycyA9IGN1cnJlbnRFbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXTtcbiAgICBmb3IgKHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldKGFyZ3MpID09PSBmYWxzZSkgcmVzdWx0ID0gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZFRvQmFjayhlbGVtZW50KSB7XG4gICAgdmFyIGRlY3JlYXNlZFpJbmRleCA9IGZhaXJseUhpZ2haSW5kZXggLSAxO1xuICAgIGVsZW1lbnQuc3R5bGVbJ3otaW5kZXgnXSA9IGRlY3JlYXNlZFpJbmRleDtcbiAgICBlbGVtZW50LnN0eWxlWyd6SW5kZXgnXSA9IGRlY3JlYXNlZFpJbmRleDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJyaW5nVG9Gcm9udChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICBlbGVtZW50LnN0eWxlWyd6SW5kZXgnXSA9IGZhaXJseUhpZ2haSW5kZXg7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBhZGREb2N1bWVudExpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEluaXRpYWxQb3NpdGlvbihlbGVtZW50KSB7XG4gICAgdmFyIHRvcCA9IDA7XG4gICAgdmFyIGxlZnQgPSAwO1xuICAgIHZhciBjdXJyZW50RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgZG8ge1xuICAgICAgdG9wICs9IGN1cnJlbnRFbGVtZW50Lm9mZnNldFRvcDtcbiAgICAgIGxlZnQgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0TGVmdDtcbiAgICB9IHdoaWxlIChjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50Lm9mZnNldFBhcmVudCk7XG5cbiAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGU/IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkgOiBmYWxzZTtcbiAgICBpZiAoY29tcHV0ZWRTdHlsZSkge1xuICAgICAgbGVmdCA9IGxlZnQgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnbWFyZ2luLWxlZnQnXSkgfHwgMCkgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnYm9yZGVyLWxlZnQnXSkgfHwgMCk7XG4gICAgICB0b3AgPSB0b3AgLSAocGFyc2VJbnQoY29tcHV0ZWRTdHlsZVsnbWFyZ2luLXRvcCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItdG9wJ10pIHx8IDApO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGxlZnQ6IGxlZnRcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaW5QaXhlbHModmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgKyAncHgnO1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCAmJiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiAmJiBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcG9zaXRpb25FbGVtZW50KGV2ZW50KSB7XG4gICAgdmFyIHN0eWxlID0gY3VycmVudEVsZW1lbnQuc3R5bGU7XG4gICAgdmFyIGVsZW1lbnRYUG9zaXRpb24gPSBwYXJzZUludChzdHlsZS5sZWZ0LCAxMCk7XG4gICAgdmFyIGVsZW1lbnRZUG9zaXRpb24gPSBwYXJzZUludChzdHlsZS50b3AsIDEwKTtcblxuICAgIHZhciBlbGVtZW50TmV3WFBvc2l0aW9uID0gZWxlbWVudFhQb3NpdGlvbiArIChldmVudC5jbGllbnRYIC0gY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbik7XG4gICAgdmFyIGVsZW1lbnROZXdZUG9zaXRpb24gPSBlbGVtZW50WVBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFkgLSBjdXJyZW50RWxlbWVudC5sYXN0WVBvc2l0aW9uKTtcblxuICAgIHN0eWxlLmxlZnQgPSBpblBpeGVscyhlbGVtZW50TmV3WFBvc2l0aW9uKTtcbiAgICBzdHlsZS50b3AgPSBpblBpeGVscyhlbGVtZW50TmV3WVBvc2l0aW9uKTtcblxuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdHJpZ2dlckV2ZW50KCdkcmFnJywgeyB4OiBlbGVtZW50TmV3WFBvc2l0aW9uLCB5OiBlbGVtZW50TmV3WVBvc2l0aW9uLCBtb3VzZUV2ZW50OiBldmVudCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKGV2ZW50KSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbik7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVwb3NpdGlvbkVsZW1lbnQpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCByZW1vdmVEb2N1bWVudExpc3RlbmVycyk7XG5cbiAgICB2YXIgbGVmdCA9IHBhcnNlSW50KGN1cnJlbnRFbGVtZW50LnN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgdG9wID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUudG9wLCAxMCk7XG4gICAgdHJpZ2dlckV2ZW50KCdzdG9wJywgeyB4OiBsZWZ0LCB5OiB0b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgcmV0dXJuIGRyYWdnYWJsZTtcbn0pO1xuOyBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXyh0eXBlb2YgZHJhZ2dhYmxlICE9IFwidW5kZWZpbmVkXCIgPyBkcmFnZ2FibGUgOiB3aW5kb3cuZHJhZ2dhYmxlKTtcblxufSkuY2FsbChnbG9iYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
