module.exports = function(document, presentation) {
    'use strict';

    var keys = {
            37: 'left',
            39: 'right',
            38: 'up',
            40: 'down',
            32: 'space'
        },
        actions = {
            next: ['right', 'space', 'up'],
            prev: ['left','down']
        };

    document.addEventListener('keydown', keydown);

    function keydown(e) {
        if (actions.prev.indexOf(keys[e.keyCode]) >= 0) {
            presentation.prev();
        } else if (actions.next.indexOf(keys[e.keyCode]) >= 0) {
            presentation.next();
        }
    }

};