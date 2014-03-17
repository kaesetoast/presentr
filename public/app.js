(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer');

window.presentation = new presentationModule(document.getElementsByClassName('slide'));

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
module.exports = function(slides) {
    'use strict';
    var exports = {},
        currentIndex = 0;

    function init() {
        setSlides();
    }

    exports.next = function() {
        exports.goTo(getNextSlideIndex(currentIndex));
    };

    exports.prev = function() {
        exports.goTo(getPrevSlideIndex(currentIndex));
    };

    exports.goTo = function(slideIndex) {
        if (slides.length > slideIndex) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvdmlld3BvcnQtb2JzZXJ2ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpO1xuXG53aW5kb3cucHJlc2VudGF0aW9uID0gbmV3IHByZXNlbnRhdGlvbk1vZHVsZShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpKTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMzcpIHtcbiAgICAgICAgd2luZG93LnByZXNlbnRhdGlvbi5wcmV2KCk7XG4gICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT09IDM5KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ubmV4dCgpO1xuICAgIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbyk7XG52aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzbGlkZXMpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudEluZGV4ID0gMDtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHNldFNsaWRlcygpO1xuICAgIH1cblxuICAgIGV4cG9ydHMubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucHJldiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ29UbyA9IGZ1bmN0aW9uKHNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKHNsaWRlcy5sZW5ndGggPiBzbGlkZUluZGV4KSB7XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPSBzbGlkZUluZGV4O1xuICAgICAgICAgICAgc2V0U2xpZGVzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc2V0U2xpZGVzKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBzbGlkZXNbaV0uY2xhc3NMaXN0LnJlbW92ZSgnY3VycmVudCcsICduZXh0JywgJ3ByZXYnLCAnbmV4dC1uZXh0JywgJ3ByZXYtcHJldicpO1xuICAgICAgICB9XG4gICAgICAgIHNsaWRlc1tjdXJyZW50SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ2N1cnJlbnQnKTtcbiAgICAgICAgdmFyIG5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleCksXG4gICAgICAgICAgICBwcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXgpO1xuICAgICAgICBpZiAobmV4dEluZGV4ICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgICAgIHNsaWRlc1tuZXh0SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ25leHQnKTtcbiAgICAgICAgICAgIHZhciBuZXh0TmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgobmV4dEluZGV4KTtcbiAgICAgICAgICAgIGlmIChuZXh0TmV4dEluZGV4ICE9PSBuZXh0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbbmV4dE5leHRJbmRleF0uY2xhc3NMaXN0LmFkZCgnbmV4dC1uZXh0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZJbmRleCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgICAgICBzbGlkZXNbcHJldkluZGV4XS5jbGFzc0xpc3QuYWRkKCdwcmV2Jyk7XG4gICAgICAgICAgICB2YXIgcHJldlByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KHByZXZJbmRleCk7XG4gICAgICAgICAgICBpZiAocHJldlByZXZJbmRleCAhPT0gcHJldkluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW3ByZXZQcmV2SW5kZXhdLmNsYXNzTGlzdC5hZGQoJ3ByZXYtcHJldicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4ICsgMSA+PSBzbGlkZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2xpZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4IDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJ2YXIgcHJlc2VudGF0aW9ucyA9IFtdO1xuXG5leHBvcnRzLnJlZ2lzdGVyUHJlc2VudGF0aW9uID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgcHJlc2VudGF0aW9ucy5hZGQocHJlc2VudGF0aW9uKTtcbn07XG5cbmV4cG9ydHMuc2V0UmF0aW8gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICAgICAgYXNwZWN0UmF0aW8gPSA0LzM7XG4gICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVySGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aCAqIGFzcGVjdFJhdGlvO1xuICAgICAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIH1cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NsaWRlLWNvbnRhaW5lcicpLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5mb250U2l6ZSA9IChoZWlnaHQgKiAwLjAwMikgKyAnZW0nO1xufTsiXX0=
