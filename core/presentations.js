var fs = require('fs');

exports.show = function(req, res) {
    var currentPresentation,
        presentation = require('./models/presentation');

    currentPresentation = new presentation(req.params.name);

    res.render('presentation', {
        slides: currentPresentation.getSlides(),
        theme: currentPresentation.getThemeName(),
        name: req.params.name,
        duration: currentPresentation.getDuration()
    });
};

exports.index = function(req, res) {
    var presentations = fs.readdirSync('presentations');
    res.render('presentations-list', {presentations: presentations});
};