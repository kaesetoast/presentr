module.exports = function (fileName) {
    'use strict';
    var exports = {},
        marked = require('marked'),
        fs = require('fs'),
        slides,
        theme = 'default';

    function init() {
        var file = fs.readFileSync('presentations/' + fileName + '/index.pmd');
        setContent(file.toString());
    }

    function setContent(data) {
        slides = [];
        var definedTheme = data.match(/<!-- Theme:(.+) -->/);
        theme = definedTheme === null ? theme : definedTheme[1].trim();
        data = data.replace(/<!--(.*)-->/, '');
        var contents = marked(data).split(/(<h1 id=\".*\">.*<\/h1>)/);
        if (contents[0] === '') {
            contents.splice(0, 1);
        }
        for (var i = 0; i < contents.length; i+=2) {
            slides.push(contents[i] + contents[i+1]);
        }
    }

    exports.getSlides = function() {
        return slides;
    };

    exports.getThemeName = function() {
        return theme;
    };

    init();

    return exports;
};
