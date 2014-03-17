exports.index = function(req, res) {
    var currentPresentation,
        presentation = require('./models/presentation');

    currentPresentation = new presentation(req.params.name);

    res.render('presentation', {
        slides: currentPresentation.getSlides(),
        theme: currentPresentation.getThemeName()
    });
};