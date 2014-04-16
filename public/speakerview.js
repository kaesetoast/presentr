require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./timer":2,"draggable":"RklVba"}],2:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3NwZWFrZXJ2aWV3LmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L3RpbWVyLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY29tcG9uZW50cy9kcmFnZ2FibGUvZHJhZ2dhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZHJhZ2dhYmxlID0gcmVxdWlyZSgnZHJhZ2dhYmxlJyksXG4gICAgY3VycmVudFZpZXcgPSB3aW5kb3cuZnJhbWVzWydjdXJyZW50LXZpZXcnXSxcbiAgICBuZXh0VmlldyA9IHdpbmRvdy5mcmFtZXNbJ25leHQtdmlldyddLFxuICAgIHRpbWVyID0gcmVxdWlyZSgnLi90aW1lcicpO1xuZHJhZ2dhYmxlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW50LXZpZXcnKSk7XG5kcmFnZ2FibGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtdmlldycpKTtcbmRyYWdnYWJsZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9vbGJveCcpKTtcblxuY3VycmVudFZpZXcuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIGN1cnJlbnRWaWV3LnByZXNlbnRhdGlvbi5jb25uZWN0KCk7XG59KTtcblxubmV4dFZpZXcuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICAgIG5leHRWaWV3LnByZXNlbnRhdGlvbi5jb25uZWN0KCk7XG59KTtcblxubmV3IHRpbWVyKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b29sYm94JyksIHBhcnNlSW50KGRvY3VtZW50LmJvZHkuZ2V0QXR0cmlidXRlKCdkYXRhLWR1cmF0aW9uJykpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgZW5kVGltZSkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICB0aW1lcixcbiAgICAgICAgdGltZUJveCxcbiAgICAgICAgdG9nZ2xlQnV0dG9uLFxuICAgICAgICByZXNldEJ1dHRvbixcbiAgICAgICAgdG90YWxTZWNvbmRzID0gMCxcbiAgICAgICAgaW50ZXJ2YWwgPSBudWxsO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgdGltZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGltZUJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGltZUJveC5jbGFzc0xpc3QuYWRkKCd0aW1lLWJveCcpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGltZXIpO1xuICAgICAgICB0aW1lci5hcHBlbmRDaGlsZCh0aW1lQm94KTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICB0b2dnbGVCdXR0b24uaW5uZXJIVE1MID0gJ+KWtic7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5jbGFzc0xpc3QuYWRkKCd0b2dnbGUtYnV0dG9uJyk7XG4gICAgICAgIHRpbWVyLmFwcGVuZENoaWxkKHRvZ2dsZUJ1dHRvbik7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZUNsaWNrKTtcbiAgICAgICAgcmVzZXRCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgIHJlc2V0QnV0dG9uLmlubmVySFRNTCA9ICdyZXNldCc7XG4gICAgICAgIHJlc2V0QnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3Jlc2V0LWJ1dHRvbicpO1xuICAgICAgICB0aW1lci5hcHBlbmRDaGlsZChyZXNldEJ1dHRvbik7XG4gICAgICAgIHJlc2V0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVzZXRDbGljayk7XG4gICAgICAgIHVwZGF0ZVRpbWVCb3goKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVUaW1lQm94KCkge1xuICAgICAgICB2YXIgc2Vjb25kcyA9IHRvdGFsU2Vjb25kcyAlIDYwLFxuICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHRvdGFsU2Vjb25kcyAvIDYwKSxcbiAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQodG90YWxTZWNvbmRzIC8gMzYwMCk7XG4gICAgICAgIHNlY29uZHMgPSBzZWNvbmRzID4gOSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuICAgICAgICBtaW51dGVzID0gbWludXRlcyA+IDkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcbiAgICAgICAgaG91cnMgPSBob3VycyA+IDkgPyBob3VycyA6ICcwJyArIGhvdXJzO1xuICAgICAgICB0aW1lQm94LmlubmVySFRNTCA9IGhvdXJzICsgJzonICsgIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzO1xuICAgICAgICBpZiAodG90YWxTZWNvbmRzICsgNjAgPiBlbmRUaW1lICYmICF0aW1lQm94LmNsYXNzTGlzdC5jb250YWlucygnbGFzdG1pbnV0ZScpKSB7XG4gICAgICAgICAgICB0aW1lQm94LmNsYXNzTGlzdC5hZGQoJ2xhc3RtaW51dGUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG90YWxTZWNvbmRzID4gZW5kVGltZSAmJiAhdGltZUJveC5jbGFzc0xpc3QuY29udGFpbnMoJ292ZXJ0aW1lJykpIHtcbiAgICAgICAgICAgIHRpbWVCb3guY2xhc3NMaXN0LmFkZCgnb3ZlcnRpbWUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgIHRvdGFsU2Vjb25kcysrO1xuICAgICAgICB1cGRhdGVUaW1lQm94KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXRDbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXhwb3J0cy5yZXNldCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvZ2dsZUNsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoaW50ZXJ2YWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuc3RhcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMucGF1c2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aWNrLCAxMDAwKTtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmlubmVySFRNTCA9ICd8fCc7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgIGludGVydmFsID0gbnVsbDtcbiAgICAgICAgdG9nZ2xlQnV0dG9uLmlubmVySFRNTCA9ICfilrYnO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMucGF1c2UoKTtcbiAgICAgICAgdG90YWxTZWNvbmRzID0gMDtcbiAgICAgICAgdXBkYXRlVGltZUJveCgpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uIGJyb3dzZXJpZnlTaGltKG1vZHVsZSwgZXhwb3J0cywgZGVmaW5lLCBicm93c2VyaWZ5X3NoaW1fX2RlZmluZV9fbW9kdWxlX19leHBvcnRfXykge1xuIShmdW5jdGlvbihtb2R1bGVOYW1lLCBkZWZpbml0aW9uKSB7XG4gIC8vIFdoZXRoZXIgdG8gZXhwb3NlIERyYWdnYWJsZSBhcyBhbiBBTUQgbW9kdWxlIG9yIHRvIHRoZSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW21vZHVsZU5hbWVdID0gZGVmaW5pdGlvbigpO1xuXG59KSgnZHJhZ2dhYmxlJywgZnVuY3Rpb24gZGVmaW5pdGlvbigpIHtcbiAgdmFyIGN1cnJlbnRFbGVtZW50O1xuICB2YXIgZmFpcmx5SGlnaFpJbmRleCA9ICcxMCc7XG5cbiAgZnVuY3Rpb24gZHJhZ2dhYmxlKGVsZW1lbnQsIGhhbmRsZSkge1xuICAgIGhhbmRsZSA9IGhhbmRsZSB8fCBlbGVtZW50O1xuICAgIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KTtcbiAgICBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCk7XG4gICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzdGFydERyYWdnaW5nKGV2ZW50LCBlbGVtZW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9uVHlwZShlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIH1cblxuICBmdW5jdGlvbiBzZXREcmFnZ2FibGVMaXN0ZW5lcnMoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzID0ge1xuICAgICAgc3RhcnQ6IFtdLFxuICAgICAgZHJhZzogW10sXG4gICAgICBzdG9wOiBbXVxuICAgIH07XG4gICAgZWxlbWVudC53aGVuRHJhZ1N0YXJ0cyA9IGFkZExpc3RlbmVyKGVsZW1lbnQsICdzdGFydCcpO1xuICAgIGVsZW1lbnQud2hlbkRyYWdnaW5nID0gYWRkTGlzdGVuZXIoZWxlbWVudCwgJ2RyYWcnKTtcbiAgICBlbGVtZW50LndoZW5EcmFnU3RvcHMgPSBhZGRMaXN0ZW5lcihlbGVtZW50LCAnc3RvcCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnREcmFnZ2luZyhldmVudCwgZWxlbWVudCkge1xuICAgIGN1cnJlbnRFbGVtZW50ICYmIHNlbmRUb0JhY2soY3VycmVudEVsZW1lbnQpO1xuICAgIGN1cnJlbnRFbGVtZW50ID0gYnJpbmdUb0Zyb250KGVsZW1lbnQpO1xuXG5cbiAgICB2YXIgaW5pdGlhbFBvc2l0aW9uID0gZ2V0SW5pdGlhbFBvc2l0aW9uKGN1cnJlbnRFbGVtZW50KTtcbiAgICBjdXJyZW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gaW5QaXhlbHMoaW5pdGlhbFBvc2l0aW9uLmxlZnQpO1xuICAgIGN1cnJlbnRFbGVtZW50LnN0eWxlLnRvcCA9IGluUGl4ZWxzKGluaXRpYWxQb3NpdGlvbi50b3ApO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RYUG9zaXRpb24gPSBldmVudC5jbGllbnRYO1xuICAgIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24gPSBldmVudC5jbGllbnRZO1xuXG4gICAgdmFyIG9rVG9Hb09uID0gdHJpZ2dlckV2ZW50KCdzdGFydCcsIHsgeDogaW5pdGlhbFBvc2l0aW9uLmxlZnQsIHk6IGluaXRpYWxQb3NpdGlvbi50b3AsIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICAgIGlmICghb2tUb0dvT24pIHJldHVybjtcblxuICAgIGFkZERvY3VtZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihlbGVtZW50LCB0eXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICBlbGVtZW50LmRyYWdnYWJsZUxpc3RlbmVyc1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlckV2ZW50KHR5cGUsIGFyZ3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gY3VycmVudEVsZW1lbnQuZHJhZ2dhYmxlTGlzdGVuZXJzW3R5cGVdO1xuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0oYXJncykgPT09IGZhbHNlKSByZXN1bHQgPSBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kVG9CYWNrKGVsZW1lbnQpIHtcbiAgICB2YXIgZGVjcmVhc2VkWkluZGV4ID0gZmFpcmx5SGlnaFpJbmRleCAtIDE7XG4gICAgZWxlbWVudC5zdHlsZVsnei1pbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZGVjcmVhc2VkWkluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gYnJpbmdUb0Zyb250KGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlWyd6LWluZGV4J10gPSBmYWlybHlIaWdoWkluZGV4O1xuICAgIGVsZW1lbnQuc3R5bGVbJ3pJbmRleCddID0gZmFpcmx5SGlnaFpJbmRleDtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZERvY3VtZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgY2FuY2VsRG9jdW1lbnRTZWxlY3Rpb24pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHJlcG9zaXRpb25FbGVtZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SW5pdGlhbFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICB2YXIgdG9wID0gMDtcbiAgICB2YXIgbGVmdCA9IDA7XG4gICAgdmFyIGN1cnJlbnRFbGVtZW50ID0gZWxlbWVudDtcbiAgICBkbyB7XG4gICAgICB0b3AgKz0gY3VycmVudEVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgbGVmdCArPSBjdXJyZW50RWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIH0gd2hpbGUgKGN1cnJlbnRFbGVtZW50ID0gY3VycmVudEVsZW1lbnQub2Zmc2V0UGFyZW50KTtcblxuICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZT8gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSA6IGZhbHNlO1xuICAgIGlmIChjb21wdXRlZFN0eWxlKSB7XG4gICAgICBsZWZ0ID0gbGVmdCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tbGVmdCddKSB8fCAwKSAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydib3JkZXItbGVmdCddKSB8fCAwKTtcbiAgICAgIHRvcCA9IHRvcCAtIChwYXJzZUludChjb21wdXRlZFN0eWxlWydtYXJnaW4tdG9wJ10pIHx8IDApIC0gKHBhcnNlSW50KGNvbXB1dGVkU3R5bGVbJ2JvcmRlci10b3AnXSkgfHwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogdG9wLFxuICAgICAgbGVmdDogbGVmdFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBpblBpeGVscyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSArICdweCc7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWxEb2N1bWVudFNlbGVjdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0ICYmIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uICYmIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwb3NpdGlvbkVsZW1lbnQoZXZlbnQpIHtcbiAgICB2YXIgc3R5bGUgPSBjdXJyZW50RWxlbWVudC5zdHlsZTtcbiAgICB2YXIgZWxlbWVudFhQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLmxlZnQsIDEwKTtcbiAgICB2YXIgZWxlbWVudFlQb3NpdGlvbiA9IHBhcnNlSW50KHN0eWxlLnRvcCwgMTApO1xuXG4gICAgdmFyIGVsZW1lbnROZXdYUG9zaXRpb24gPSBlbGVtZW50WFBvc2l0aW9uICsgKGV2ZW50LmNsaWVudFggLSBjdXJyZW50RWxlbWVudC5sYXN0WFBvc2l0aW9uKTtcbiAgICB2YXIgZWxlbWVudE5ld1lQb3NpdGlvbiA9IGVsZW1lbnRZUG9zaXRpb24gKyAoZXZlbnQuY2xpZW50WSAtIGN1cnJlbnRFbGVtZW50Lmxhc3RZUG9zaXRpb24pO1xuXG4gICAgc3R5bGUubGVmdCA9IGluUGl4ZWxzKGVsZW1lbnROZXdYUG9zaXRpb24pO1xuICAgIHN0eWxlLnRvcCA9IGluUGl4ZWxzKGVsZW1lbnROZXdZUG9zaXRpb24pO1xuXG4gICAgY3VycmVudEVsZW1lbnQubGFzdFhQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFg7XG4gICAgY3VycmVudEVsZW1lbnQubGFzdFlQb3NpdGlvbiA9IGV2ZW50LmNsaWVudFk7XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2RyYWcnLCB7IHg6IGVsZW1lbnROZXdYUG9zaXRpb24sIHk6IGVsZW1lbnROZXdZUG9zaXRpb24sIG1vdXNlRXZlbnQ6IGV2ZW50IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGNhbmNlbERvY3VtZW50U2VsZWN0aW9uKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXBvc2l0aW9uRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHJlbW92ZURvY3VtZW50TGlzdGVuZXJzKTtcblxuICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoY3VycmVudEVsZW1lbnQuc3R5bGUubGVmdCwgMTApO1xuICAgIHZhciB0b3AgPSBwYXJzZUludChjdXJyZW50RWxlbWVudC5zdHlsZS50b3AsIDEwKTtcbiAgICB0cmlnZ2VyRXZlbnQoJ3N0b3AnLCB7IHg6IGxlZnQsIHk6IHRvcCwgbW91c2VFdmVudDogZXZlbnQgfSk7XG4gIH1cblxuICByZXR1cm4gZHJhZ2dhYmxlO1xufSk7XG47IGJyb3dzZXJpZnlfc2hpbV9fZGVmaW5lX19tb2R1bGVfX2V4cG9ydF9fKHR5cGVvZiBkcmFnZ2FibGUgIT0gXCJ1bmRlZmluZWRcIiA/IGRyYWdnYWJsZSA6IHdpbmRvdy5kcmFnZ2FibGUpO1xuXG59KS5jYWxsKGdsb2JhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZnVuY3Rpb24gZGVmaW5lRXhwb3J0KGV4KSB7IG1vZHVsZS5leHBvcnRzID0gZXg7IH0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
