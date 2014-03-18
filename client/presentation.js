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