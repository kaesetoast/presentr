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