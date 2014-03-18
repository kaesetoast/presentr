module.exports = function(presentation) {
    'use strict';
    var exports = {},
        searchWrapper,
        searchInput,
        isOpen = false;

    function init() {
        setBaseElements();
    }

    function setBaseElements() {
        searchWrapper = document.createElement('section');
        searchWrapper.classList.add('gotoslide');
        searchInput = document.createElement('input');
        searchInput.type = 'number';
        searchInput.min = 1;
        searchInput.max = presentation.getSlides().length;
        searchWrapper.appendChild(searchInput);
    }

    init();

    exports.open = function(event) {
        event.currentTarget.parentNode.insertBefore(searchWrapper, event.currentTarget.nextSibling);
        searchWrapper.addEventListener('keyup', fire);
        searchInput.value = presentation.getCurrentSlideIndex() + 1;
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

    function fire(event) {
        if (event.keyCode === 13) {
            presentation.goTo(searchInput.value - 1);
            exports.close();
        } else if (event.keyCode === 27) {
            exports.close();
        }
    }

    return exports;
};