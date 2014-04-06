/**
 * This module is resposible for synchronisation of presentations
 */

var io,
    presentationSockets = {};

/**
 * Start the socketServer
 * @param  {Object} server The server instance
 */
exports.start = function(server) {
    io = require('socket.io').listen(server);
    io.sockets.on('connection', setupConnection);
};

function setupConnection(socket) {
    socket.on('register', registerPresentation);
    socket.on('goto-slide', emitSlideEvent);
}

function registerPresentation(data) {
    // create socket array for this presentation if not already present
    if (typeof presentationSockets[data.presentation] === 'undefined') {
        presentationSockets[data.presentation] = [];
    }
    // store this socket
    presentationSockets[data.presentation].push(this);
    console.log('registered ' + data.presentation);
}

function emitSlideEvent(data) {
    // get all sockets for this presentation
    var sockets = presentationSockets[data.presentationName];
    if (typeof sockets !== 'undefined') {
        for (var i = sockets.length - 1; i >= 0; i--) {
            if (sockets[i] !== this) {
                sockets[i].emit('goto-slide', data.slide);
            }
        }
    }
}