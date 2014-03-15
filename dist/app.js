(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.getContentFrom = function(filePath, callback) {
    'use strict';
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            callback.call(callback, xmlhttp.responseText);
        }
    };
    xmlhttp.open('POST', filePath ,true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.send();
};
},{}],2:[function(require,module,exports){
var presentation = require('./presentation');

var pres = new presentation('./presentations/demo/index.pmd');
console.log(pres.getContent());
},{"./presentation":3}],3:[function(require,module,exports){
module.exports = function (fileName) {
    'use strict';
    var exports = {},
        ajaxCaller = require('./ajaxCaller'),
        content;
    ajaxCaller.getContentFrom(fileName, setContent);

    function setContent(data) {
        content = data;
    }

    exports.getContent = function() {
        return content;
    };

    return exports;
};
},{"./ajaxCaller":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvc3JjL2FqYXhDYWxsZXIuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9zcmMvYXBwLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvc3JjL3ByZXNlbnRhdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImV4cG9ydHMuZ2V0Q29udGVudEZyb20gPSBmdW5jdGlvbihmaWxlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIHhtbGh0dHA7XG4gICAgeG1saHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQgJiYgeG1saHR0cC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjYWxsYmFjaywgeG1saHR0cC5yZXNwb25zZVRleHQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB4bWxodHRwLm9wZW4oJ1BPU1QnLCBmaWxlUGF0aCAsdHJ1ZSk7XG4gICAgeG1saHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XG4gICAgeG1saHR0cC5zZW5kKCk7XG59OyIsInZhciBwcmVzZW50YXRpb24gPSByZXF1aXJlKCcuL3ByZXNlbnRhdGlvbicpO1xuXG52YXIgcHJlcyA9IG5ldyBwcmVzZW50YXRpb24oJy4vcHJlc2VudGF0aW9ucy9kZW1vL2luZGV4LnBtZCcpO1xuY29uc29sZS5sb2cocHJlcy5nZXRDb250ZW50KCkpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZpbGVOYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGFqYXhDYWxsZXIgPSByZXF1aXJlKCcuL2FqYXhDYWxsZXInKSxcbiAgICAgICAgY29udGVudDtcbiAgICBhamF4Q2FsbGVyLmdldENvbnRlbnRGcm9tKGZpbGVOYW1lLCBzZXRDb250ZW50KTtcblxuICAgIGZ1bmN0aW9uIHNldENvbnRlbnQoZGF0YSkge1xuICAgICAgICBjb250ZW50ID0gZGF0YTtcbiAgICB9XG5cbiAgICBleHBvcnRzLmdldENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiXX0=
