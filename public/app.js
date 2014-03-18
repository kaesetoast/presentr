(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer');

window.presentation = new presentationModule(document.getElementsByClassName('slide'), document.body.getAttribute('data-presentation'));

document.addEventListener('keydown', function(e) {
    'use strict';
    if (e.keyCode === 37) {
        window.presentation.prev();
    } else if (e.keyCode === 39) {
        window.presentation.next();
    }
});

window.addEventListener('resize', viewportObserver.setRatio);
viewportObserver.setRatio();
},{"./presentation":2,"./viewport-observer":3}],2:[function(require,module,exports){
module.exports = function(slides, name) {
    'use strict';
    var exports = {},
        currentIndex = 0,
        socket;

    function init() {
        setSlides();
        socket = io.connect('http://localhost');
        socket.on('goto-slide', function(data){
            exports.goTo(data, true);
        });
        socket.emit('register', {presentation: name});
    }

    exports.next = function() {
        exports.goTo(getNextSlideIndex(currentIndex));
    };

    exports.prev = function() {
        exports.goTo(getPrevSlideIndex(currentIndex));
    };

    exports.goTo = function(slideIndex, remoteInvoked) {
        if (slides.length > slideIndex) {
            if (!remoteInvoked) {
                socket.emit('goto-slide', {presentationName: name, slide: slideIndex});
            }
            currentIndex = slideIndex;
            setSlides();
        }
    };

    function setSlides() {
        for (var i = slides.length - 1; i >= 0; i--) {
            slides[i].classList.remove('current', 'next', 'prev', 'next-next', 'prev-prev');
        }
        slides[currentIndex].classList.add('current');
        var nextIndex = getNextSlideIndex(currentIndex),
            prevIndex = getPrevSlideIndex(currentIndex);
        if (nextIndex !== currentIndex) {
            slides[nextIndex].classList.add('next');
            var nextNextIndex = getNextSlideIndex(nextIndex);
            if (nextNextIndex !== nextIndex) {
                slides[nextNextIndex].classList.add('next-next');
            }
        }
        if (prevIndex !== currentIndex) {
            slides[prevIndex].classList.add('prev');
            var prevPrevIndex = getPrevSlideIndex(prevIndex);
            if (prevPrevIndex !== prevIndex) {
                slides[prevPrevIndex].classList.add('prev-prev');
            }
        }
    }

    function getNextSlideIndex(currentSlideIndex) {
        if (currentSlideIndex + 1 >= slides.length) {
            return slides.length - 1;
        } else {
            return currentSlideIndex + 1;
        }
    }

    function getPrevSlideIndex(currentSlideIndex) {
        if (currentSlideIndex <= 0) {
            return 0;
        } else {
            return currentSlideIndex - 1;
        }
    }

    init();

    return exports;
};
},{}],3:[function(require,module,exports){
var presentations = [];

exports.registerPresentation = function(presentation) {
    presentations.add(presentation);
};

exports.setRatio = function() {
    var width,
        height,
        aspectRatio = 4/3;
    if (window.innerWidth > window.innerHeight) {
        width = window.innerHeight * aspectRatio;
        height = window.innerHeight;
    } else {
        height = window.innerWidth * aspectRatio;
        width = window.innerWidth;
    }
    document.getElementById('slide-container').style.width = width + 'px';
    document.getElementById('slide-container').style.height = height + 'px';
    document.body.style.fontSize = (height * 0.002) + 'em';
};
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpO1xuXG53aW5kb3cucHJlc2VudGF0aW9uID0gbmV3IHByZXNlbnRhdGlvbk1vZHVsZShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpLCBkb2N1bWVudC5ib2R5LmdldEF0dHJpYnV0ZSgnZGF0YS1wcmVzZW50YXRpb24nKSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGlmIChlLmtleUNvZGUgPT09IDM3KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ucHJldigpO1xuICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09PSAzOSkge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLm5leHQoKTtcbiAgICB9XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8pO1xudmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbygpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2xpZGVzLCBuYW1lKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGN1cnJlbnRJbmRleCA9IDAsXG4gICAgICAgIHNvY2tldDtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHNldFNsaWRlcygpO1xuICAgICAgICBzb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgIHNvY2tldC5vbignZ290by1zbGlkZScsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgZXhwb3J0cy5nb1RvKGRhdGEsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgc29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge3ByZXNlbnRhdGlvbjogbmFtZX0pO1xuICAgIH1cblxuICAgIGV4cG9ydHMubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucHJldiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ29UbyA9IGZ1bmN0aW9uKHNsaWRlSW5kZXgsIHJlbW90ZUludm9rZWQpIHtcbiAgICAgICAgaWYgKHNsaWRlcy5sZW5ndGggPiBzbGlkZUluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIXJlbW90ZUludm9rZWQpIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgnZ290by1zbGlkZScsIHtwcmVzZW50YXRpb25OYW1lOiBuYW1lLCBzbGlkZTogc2xpZGVJbmRleH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VycmVudEluZGV4ID0gc2xpZGVJbmRleDtcbiAgICAgICAgICAgIHNldFNsaWRlcygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlcygpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNsaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgc2xpZGVzW2ldLmNsYXNzTGlzdC5yZW1vdmUoJ2N1cnJlbnQnLCAnbmV4dCcsICdwcmV2JywgJ25leHQtbmV4dCcsICdwcmV2LXByZXYnKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXNbY3VycmVudEluZGV4XS5jbGFzc0xpc3QuYWRkKCdjdXJyZW50Jyk7XG4gICAgICAgIHZhciBuZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXgpLFxuICAgICAgICAgICAgcHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4KTtcbiAgICAgICAgaWYgKG5leHRJbmRleCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgICAgICBzbGlkZXNbbmV4dEluZGV4XS5jbGFzc0xpc3QuYWRkKCduZXh0Jyk7XG4gICAgICAgICAgICB2YXIgbmV4dE5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KG5leHRJbmRleCk7XG4gICAgICAgICAgICBpZiAobmV4dE5leHRJbmRleCAhPT0gbmV4dEluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW25leHROZXh0SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ25leHQtbmV4dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2SW5kZXggIT09IGN1cnJlbnRJbmRleCkge1xuICAgICAgICAgICAgc2xpZGVzW3ByZXZJbmRleF0uY2xhc3NMaXN0LmFkZCgncHJldicpO1xuICAgICAgICAgICAgdmFyIHByZXZQcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChwcmV2SW5kZXgpO1xuICAgICAgICAgICAgaWYgKHByZXZQcmV2SW5kZXggIT09IHByZXZJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1twcmV2UHJldkluZGV4XS5jbGFzc0xpc3QuYWRkKCdwcmV2LXByZXYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCArIDEgPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwidmFyIHByZXNlbnRhdGlvbnMgPSBbXTtcblxuZXhwb3J0cy5yZWdpc3RlclByZXNlbnRhdGlvbiA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgIHByZXNlbnRhdGlvbnMuYWRkKHByZXNlbnRhdGlvbik7XG59O1xuXG5leHBvcnRzLnNldFJhdGlvID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoLFxuICAgICAgICBoZWlnaHQsXG4gICAgICAgIGFzcGVjdFJhdGlvID0gNC8zO1xuICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVyV2lkdGggKiBhc3BlY3RSYXRpbztcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB9XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuZm9udFNpemUgPSAoaGVpZ2h0ICogMC4wMDIpICsgJ2VtJztcbn07Il19
