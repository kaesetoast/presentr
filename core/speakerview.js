var fs = require('fs');

exports.show = function(req, res) {
    var currentPresentation,
        presentation = require('./models/presentation');

    currentPresentation = new presentation(req.params.name);

    res.render('speakerview', {
        presentation: req.params.name
    });
};