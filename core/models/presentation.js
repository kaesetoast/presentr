module.exports = function (fileName) {
    'use strict';
    var exports = {},
        marked = require('marked'),
        fs = require('fs'),
        slides,
        theme = 'default',
        duration = 0;

    function init() {
        var file = fs.readFileSync('presentations/' + fileName + '/index.pmd');
        setContent(file.toString());
    }

    function setContent(data) {
        slides = [];
        theme = extractMetaData('Theme', data);
        duration = extractMetaData('Duration', data);
        duration = parseDuration(duration);
        data = data.replace(/<!--(.*)-->/g, '');
        var contents = marked(data).split(/(<h1 id=\".*\">.*<\/h1>)/);
        if (contents[0] === '') {
            contents.splice(0, 1);
        }
        for (var i = 0; i < contents.length; i+=2) {
            slides.push(contents[i] + contents[i+1]);
        }
    }

    function extractMetaData(propertyName, data) {
        var prop = data.match(new RegExp('<!-- ' + propertyName + ':(.+) -->'));
        prop = prop === null ? prop : prop[1].trim();
        return prop;
    }

    function parseDuration(duration) {
        var durationParts = duration.split(':'),
            seconds = (parseInt(durationParts[0]) * 3600) + (parseInt(durationParts[1]) * 60) + parseInt(durationParts[2]);
        return seconds;
    }

    exports.getSlides = function() {
        return slides;
    };

    exports.getThemeName = function() {
        return theme;
    };

    exports.getDuration = function() {
        return duration;
    };

    init();

    return exports;
};
