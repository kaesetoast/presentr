
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    presentations = require('./core/presentations'),
    speakerview = require('./core/speakerview');

var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);

// all environments
app.configure(function(){
    'use strict';
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

// development only
app.configure('development', function(){
    'use strict';
    app.use(express.errorHandler());
});

// routes
app.get('/', function(req, res){
    'use strict';
    res.render('index');
});
app.get('/presentations', presentations.index);
app.get('/presentations/:name', presentations.show);
app.get('/presentations/:name/preview', presentations.show);
app.get('/speakerview/:name', speakerview.show);

http.createServer(app).listen(app.get('port'), function(){
    'use strict';
    console.log('Express server listening on port ' + app.get('port'));
});

// io-server
var presentationSockets = {};
io.sockets.on('connection', function(socket){
    'use strict';
    socket.on('register', function(data){
        if (typeof presentationSockets[data.presentation] === 'undefined') {
            presentationSockets[data.presentation] = [];
        }
        presentationSockets[data.presentation].push(socket);
        console.log('registered ' + data.presentation);
    });
    socket.on('goto-slide', function(data){
        var sockets = presentationSockets[data.presentationName];
        if (typeof sockets !== 'undefined') {
            for (var i = sockets.length - 1; i >= 0; i--) {
                if (sockets[i] !== socket) {
                    sockets[i].emit('goto-slide', data.slide);
                }
            }
        }
    });
});