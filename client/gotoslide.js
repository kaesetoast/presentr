module.exports = function(presentation) {
    'use strict';
    var exports = {},
        searchWrapper,
        searchInput,
        slideHeadline,
        isOpen = false,
        slides;

    function init() {
        slides = presentation.getSlides();
        setBaseElements();
    }

    function setBaseElements() {
        searchWrapper = document.createElement('section');
        searchWrapper.classList.add('gotoslide');
        searchInput = document.createElement('input');
        searchInput.type = 'number';
        searchInput.min = 1;
        searchInput.max = slides.length;
        searchWrapper.appendChild(searchInput);
        slideHeadline = document.createElement('span');
        slideHeadline.classList.add('slide-headline');
        searchWrapper.appendChild(slideHeadline);
        slideHeadline.addEventListener('click', goToSelectedSlide);
    }

    exports.open = function(event) {
        event.currentTarget.parentNode.insertBefore(searchWrapper, event.currentTarget.nextSibling);
        searchWrapper.addEventListener('keyup', fire);
        searchInput.addEventListener('input', setSlideHeadline);
        searchInput.addEventListener('change', setSlideHeadline);
        searchInput.value = presentation.getCurrentSlideIndex() + 1;
        setSlideHeadline();
        isOpen = true;
    };

    exports.close = function() {
        searchWrapper.parentNode.removeChild(searchWrapper);
        searchWrapper.removeEventListener('keyup', fire);
        isOpen = false;
    };

    exports.toggle = function(event) {
        event.preventDefault();
        if (isOpen) {
            exports.close(event);
        } else {
            exports.open(event);
        }
    };

    function setSlideHeadline() {
        slideHeadline.innerHTML = slides[searchInput.value - 1].getHeadline();
    }

    function goToSelectedSlide() {
        presentation.goTo(searchInput.value - 1);
    }

    function fire(event) {
        if (event.keyCode === 13) {
            goToSelectedSlide();
            exports.close();
        } else if (event.keyCode === 27) {
            exports.close();
        }
    }

    init();

    return exports;
};