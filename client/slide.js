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