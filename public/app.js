(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    controls = require('./controls'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.href.indexOf('/preview', window.location.href.length - 8) > 0;

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(window.presentation);

new controls(document, window.presentation);

window.addEventListener('resize', viewportObserver.setRatio);
viewportObserver.setRatio();
},{"./controls":2,"./presentation":5,"./sidebar":6,"./viewport-observer":8}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {};

    exports.toggle = function(event) {
        event.preventDefault();
        if (presentation.isConnected()) {
            presentation.disconnect();
            event.currentTarget.classList.remove('icon-connected');
            event.currentTarget.classList.add('icon-disconnected');
            event.currentTarget.innerHTML = 'Connect to session';
        } else {
            presentation.connect();
            event.currentTarget.classList.remove('icon-disconnected');
            event.currentTarget.classList.add('icon-connected');
            event.currentTarget.innerHTML = 'Disconnect from session';
        }
    };

    return exports;
};
},{}],5:[function(require,module,exports){
module.exports = function(slideElements, name, isPreviewDeck) {
    'use strict';
    var exports = {},
        currentIndex = 0,
        socket,
        Slide = require('./slide'),
        slides = [];

    function init() {
        initSlides();
        if (isPreviewDeck) {
            addEndSlide();
        }
        if (window.location.hash !== '') {
            hashChanged();
        } else {
            exports.goTo(0);
        }
        window.addEventListener('hashchange', hashChanged);
    }

    exports.next = function() {
        exports.goTo(getNextSlideIndex(currentIndex));
    };

    exports.prev = function() {
        exports.goTo(getPrevSlideIndex(currentIndex));
    };

    exports.getCurrentSlideIndex = function() {
        return currentIndex;
    };

    exports.goTo = function(slideIndex, remoteInvoked) {
        if (slides.length > slideIndex) {
            if (!remoteInvoked && typeof socket !== 'undefined') {
                socket.emit('goto-slide', {presentationName: name, slide: slideIndex});
            }
            currentIndex = slideIndex;
            window.location.hash = currentIndex + 1;
            setSlides();
        }
    };

    exports.getSlides = function() {
        return slides;
    };

    exports.getName = function() {
        return name;
    };

    exports.isConnected = function() {
        return typeof socket !== 'undefined' && socket.socket.connected;
    };

    exports.connect = function() {
        if (typeof socket === 'undefined') {
            socket = io.connect('http://guybrush');
            socket.on('goto-slide', function(data){
                exports.goTo(data, true);
            });
        } else {
            socket.socket.connect();
        }
        socket.emit('register', {presentation: name});
    };

    exports.disconnect = function() {
        socket.disconnect();
    };

    function initSlides() {
        for (var i = 0; i < slideElements.length; i++) {
            slides.push(new Slide(slideElements[i]));
        }
    }

    function hashChanged() {
        exports.goTo(parseInt(window.location.hash.substring(1)) - 1);
    }

    function addEndSlide() {
        var article = document.createElement('article');
        article.classList.add('slide', 'end');
        slides[slides.length-1].getDomNode().parentNode.insertBefore(article, slides[slides.length-1].nextSibling);
        slides.push(new Slide(article));
    }

    function setSlides() {
        var currentIndexLocal = isPreviewDeck ? (currentIndex + 1) : currentIndex;
        for (var i = slides.length - 1; i >= 0; i--) {
            slides[i].clearStatus();
        }
        slides[currentIndexLocal].setStatus('current');
        var nextIndex = getNextSlideIndex(currentIndexLocal),
            prevIndex = getPrevSlideIndex(currentIndexLocal);
        if (nextIndex !== currentIndexLocal) {
            slides[nextIndex].setStatus('next');
            var nextNextIndex = getNextSlideIndex(nextIndex);
            if (nextNextIndex !== nextIndex) {
                slides[nextNextIndex].setStatus('next-next');
            }
        }
        if (prevIndex !== currentIndexLocal) {
            slides[prevIndex].setStatus('prev');
            var prevPrevIndex = getPrevSlideIndex(prevIndex);
            if (prevPrevIndex !== prevIndex) {
                slides[prevPrevIndex].setStatus('prev-prev');
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
},{"./slide":7}],6:[function(require,module,exports){
module.exports = function(presentation) {
    'use strict';
    var exports = {},
        sidebar,
        elementsList,
        Gotoslide = require('./gotoslide'),
        PresentationConnector = require('./presentation-connector'),
        elements = [
            {
                label: 'Speakerview',
                action: '/speakerview/' + presentation.getName(),
                target: '_blank',
                class: 'icon-screen'
            },
            {
                label: 'Go to slide',
                // This needs to become more generic
                action: new Gotoslide(presentation).toggle,
                class: 'icon-search'
            },
            {
                label: 'Connect to session',
                action: new PresentationConnector(presentation).toggle,
                class: 'icon-disconnected'
            },
            {
                label: 'Browse Presentations',
                action: '/presentations',
                class: 'icon-menu'
            }
        ],
        slideContainer = document.getElementById('slide-container');

    function init() {
        setBaseElements();
        setElements();
        setListener();
    }

    function setBaseElements() {
        sidebar = document.createElement('aside');
        sidebar.id = 'sidebar';
        sidebar.classList.add('sidebar');
        document.body.appendChild(sidebar);
        var label = document.createElement('h1');
        var anchor = document.createElement('a');
        anchor.href = '/';
        label.appendChild(anchor);
        label.classList.add('label', 'icon-presentr');
        anchor.innerHTML = 'presentr';
        sidebar.appendChild(label);
    }

    function setElements() {
        elementsList = document.createElement('ul');
        sidebar.appendChild(elementsList);
        for (var i = 0; i < elements.length; i++) {
            var listItem = document.createElement('li');
            var anchor = document.createElement('a');
            listItem.appendChild(anchor);
            anchor.innerHTML = elements[i].label;
            if (typeof elements[i].action === 'string') {
                anchor.href = elements[i].action;
                if (typeof elements[i].target !== 'undefined') {
                    anchor.target = elements[i].target;
                }
            } else {
                anchor.href = '';
                anchor.addEventListener('click', elements[i].action);
            }
            if (typeof elements[i].class !== 'undefined') {
                anchor.classList.add(elements[i].class);
            }
            elementsList.appendChild(listItem);
        }
    }

    function setListener() {
        document.addEventListener('keyup', hotKey);
    }

    function hotKey(event) {
        if (event.keyCode === 77) {
            exports.toggle();
        }
    }

    exports.toggle = function() {
        if (sidebar.classList.contains('open')) {
            exports.close();
        } else {
            exports.open();
        }
    };

    exports.open = function() {
        sidebar.classList.add('open');
        slideContainer.addEventListener('click', offClick);
    };

    function offClick() {
        exports.close();
        slideContainer.removeEventListener('click', offClick);
    }

    exports.close = function() {
        sidebar.classList.remove('open');
    };

    init();

    return exports;
};
},{"./gotoslide":3,"./presentation-connector":4}],7:[function(require,module,exports){
module.exports = function(slideElement) {
    'use strict';
    var exports = {},
        currentStatus = {},
        headline;

    exports.setStatus = function(status) {
        slideElement.classList.add(status);
        currentStatus[status] = status;
    };

    exports.clearStatus = function() {
        for (var status in currentStatus) {
            slideElement.classList.remove(status);
            delete currentStatus[status];
        }
    };

    exports.getHeadline = function() {
        if (typeof headline === 'undefined') {
            var search = slideElement.innerHTML.match(/<h1.*>(.*)<\/h1>/);
            headline = search[1];
        }
        return headline;
    };

    exports.getDomNode = function() {
        return slideElement;
    };

    return exports;
};
},{}],8:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9jb250cm9scy5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLWNvbm5lY3Rvci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvc2lkZWJhci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9zbGlkZS5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC92aWV3cG9ydC1vYnNlcnZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJlc2VudGF0aW9uTW9kdWxlID0gcmVxdWlyZSgnLi9wcmVzZW50YXRpb24nKSxcbiAgICB2aWV3cG9ydE9ic2VydmVyID0gcmVxdWlyZSgnLi92aWV3cG9ydC1vYnNlcnZlcicpLFxuICAgIHNpZGViYXIgPSByZXF1aXJlKCcuL3NpZGViYXInKSxcbiAgICBjb250cm9scyA9IHJlcXVpcmUoJy4vY29udHJvbHMnKSxcbiAgICBwcmVzZW50YXRpb25OYW1lID0gZG9jdW1lbnQuYm9keS5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHJlc2VudGF0aW9uJyksXG4gICAgaXNQcmV2aWV3RGVjayA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJy9wcmV2aWV3Jywgd2luZG93LmxvY2F0aW9uLmhyZWYubGVuZ3RoIC0gOCkgPiAwO1xuXG53aW5kb3cucHJlc2VudGF0aW9uID0gbmV3IHByZXNlbnRhdGlvbk1vZHVsZShkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzbGlkZScpLCBwcmVzZW50YXRpb25OYW1lLCBpc1ByZXZpZXdEZWNrKTtcbm5ldyBzaWRlYmFyKHdpbmRvdy5wcmVzZW50YXRpb24pO1xuXG5uZXcgY29udHJvbHMoZG9jdW1lbnQsIHdpbmRvdy5wcmVzZW50YXRpb24pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbyk7XG52aWV3cG9ydE9ic2VydmVyLnNldFJhdGlvKCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkb2N1bWVudCwgcHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGtleXMgPSB7XG4gICAgICAgICAgICAzNzogJ2xlZnQnLFxuICAgICAgICAgICAgMzk6ICdyaWdodCcsXG4gICAgICAgICAgICAzODogJ3VwJyxcbiAgICAgICAgICAgIDQwOiAnZG93bicsXG4gICAgICAgICAgICAzMjogJ3NwYWNlJ1xuICAgICAgICB9LFxuICAgICAgICBhY3Rpb25zID0ge1xuICAgICAgICAgICAgbmV4dDogWydyaWdodCcsICdzcGFjZScsICd1cCddLFxuICAgICAgICAgICAgcHJldjogWydsZWZ0JywnZG93biddXG4gICAgICAgIH07XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG5cbiAgICBmdW5jdGlvbiBrZXlkb3duKGUpIHtcbiAgICAgICAgaWYgKGFjdGlvbnMucHJldi5pbmRleE9mKGtleXNbZS5rZXlDb2RlXSkgPj0gMCkge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLnByZXYoKTtcbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb25zLm5leHQuaW5kZXhPZihrZXlzW2Uua2V5Q29kZV0pID49IDApIHtcbiAgICAgICAgICAgIHByZXNlbnRhdGlvbi5uZXh0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2VhcmNoV3JhcHBlcixcbiAgICAgICAgc2VhcmNoSW5wdXQsXG4gICAgICAgIHNsaWRlSGVhZGxpbmUsXG4gICAgICAgIGlzT3BlbiA9IGZhbHNlLFxuICAgICAgICBzbGlkZXM7XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzbGlkZXMgPSBwcmVzZW50YXRpb24uZ2V0U2xpZGVzKCk7XG4gICAgICAgIHNldEJhc2VFbGVtZW50cygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJhc2VFbGVtZW50cygpIHtcbiAgICAgICAgc2VhcmNoV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5jbGFzc0xpc3QuYWRkKCdnb3Rvc2xpZGUnKTtcbiAgICAgICAgc2VhcmNoSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBzZWFyY2hJbnB1dC50eXBlID0gJ251bWJlcic7XG4gICAgICAgIHNlYXJjaElucHV0Lm1pbiA9IDE7XG4gICAgICAgIHNlYXJjaElucHV0Lm1heCA9IHNsaWRlcy5sZW5ndGg7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuYXBwZW5kQ2hpbGQoc2VhcmNoSW5wdXQpO1xuICAgICAgICBzbGlkZUhlYWRsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBzbGlkZUhlYWRsaW5lLmNsYXNzTGlzdC5hZGQoJ3NsaWRlLWhlYWRsaW5lJyk7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuYXBwZW5kQ2hpbGQoc2xpZGVIZWFkbGluZSk7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBnb1RvU2VsZWN0ZWRTbGlkZSk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzZWFyY2hXcmFwcGVyLCBldmVudC5jdXJyZW50VGFyZ2V0Lm5leHRTaWJsaW5nKTtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZpcmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHNldFNsaWRlSGVhZGxpbmUpO1xuICAgICAgICBzZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBzZXRTbGlkZUhlYWRsaW5lKTtcbiAgICAgICAgc2VhcmNoSW5wdXQudmFsdWUgPSBwcmVzZW50YXRpb24uZ2V0Q3VycmVudFNsaWRlSW5kZXgoKSArIDE7XG4gICAgICAgIHNldFNsaWRlSGVhZGxpbmUoKTtcbiAgICAgICAgaXNPcGVuID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWFyY2hXcmFwcGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2VhcmNoV3JhcHBlcik7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmaXJlKTtcbiAgICAgICAgaXNPcGVuID0gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4cG9ydHMudG9nZ2xlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKGlzT3Blbikge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZShldmVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLm9wZW4oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlSGVhZGxpbmUoKSB7XG4gICAgICAgIHNsaWRlSGVhZGxpbmUuaW5uZXJIVE1MID0gc2xpZGVzW3NlYXJjaElucHV0LnZhbHVlIC0gMV0uZ2V0SGVhZGxpbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnb1RvU2VsZWN0ZWRTbGlkZSgpIHtcbiAgICAgICAgcHJlc2VudGF0aW9uLmdvVG8oc2VhcmNoSW5wdXQudmFsdWUgLSAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgZ29Ub1NlbGVjdGVkU2xpZGUoKTtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSAyNykge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge307XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChwcmVzZW50YXRpb24uaXNDb25uZWN0ZWQoKSkge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnaWNvbi1jb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmFkZCgnaWNvbi1kaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gJ0Nvbm5lY3QgdG8gc2Vzc2lvbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVzZW50YXRpb24uY29ubmVjdCgpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKCdpY29uLWRpc2Nvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKCdpY29uLWNvbm5lY3RlZCcpO1xuICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5pbm5lckhUTUwgPSAnRGlzY29ubmVjdCBmcm9tIHNlc3Npb24nO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNsaWRlRWxlbWVudHMsIG5hbWUsIGlzUHJldmlld0RlY2spIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgY3VycmVudEluZGV4ID0gMCxcbiAgICAgICAgc29ja2V0LFxuICAgICAgICBTbGlkZSA9IHJlcXVpcmUoJy4vc2xpZGUnKSxcbiAgICAgICAgc2xpZGVzID0gW107XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBpbml0U2xpZGVzKCk7XG4gICAgICAgIGlmIChpc1ByZXZpZXdEZWNrKSB7XG4gICAgICAgICAgICBhZGRFbmRTbGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaGFzaCAhPT0gJycpIHtcbiAgICAgICAgICAgIGhhc2hDaGFuZ2VkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzLmdvVG8oMCk7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBoYXNoQ2hhbmdlZCk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXROZXh0U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5wcmV2ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhnZXRQcmV2U2xpZGVJbmRleChjdXJyZW50SW5kZXgpKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXRDdXJyZW50U2xpZGVJbmRleCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudEluZGV4O1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdvVG8gPSBmdW5jdGlvbihzbGlkZUluZGV4LCByZW1vdGVJbnZva2VkKSB7XG4gICAgICAgIGlmIChzbGlkZXMubGVuZ3RoID4gc2xpZGVJbmRleCkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdGVJbnZva2VkICYmIHR5cGVvZiBzb2NrZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoJ2dvdG8tc2xpZGUnLCB7cHJlc2VudGF0aW9uTmFtZTogbmFtZSwgc2xpZGU6IHNsaWRlSW5kZXh9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCA9IHNsaWRlSW5kZXg7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGN1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICBzZXRTbGlkZXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBleHBvcnRzLmdldFNsaWRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2xpZGVzO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldE5hbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBzb2NrZXQgIT09ICd1bmRlZmluZWQnICYmIHNvY2tldC5zb2NrZXQuY29ubmVjdGVkO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb2NrZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpby5jb25uZWN0KCdodHRwOi8vZ3V5YnJ1c2gnKTtcbiAgICAgICAgICAgIHNvY2tldC5vbignZ290by1zbGlkZScsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgIGV4cG9ydHMuZ29UbyhkYXRhLCB0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0LnNvY2tldC5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgc29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge3ByZXNlbnRhdGlvbjogbmFtZX0pO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaW5pdFNsaWRlcygpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGlkZUVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzbGlkZXMucHVzaChuZXcgU2xpZGUoc2xpZGVFbGVtZW50c1tpXSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzaENoYW5nZWQoKSB7XG4gICAgICAgIGV4cG9ydHMuZ29UbyhwYXJzZUludCh3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkpIC0gMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkRW5kU2xpZGUoKSB7XG4gICAgICAgIHZhciBhcnRpY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXJ0aWNsZScpO1xuICAgICAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ3NsaWRlJywgJ2VuZCcpO1xuICAgICAgICBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5nZXREb21Ob2RlKCkucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoYXJ0aWNsZSwgc2xpZGVzW3NsaWRlcy5sZW5ndGgtMV0ubmV4dFNpYmxpbmcpO1xuICAgICAgICBzbGlkZXMucHVzaChuZXcgU2xpZGUoYXJ0aWNsZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFNsaWRlcygpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleExvY2FsID0gaXNQcmV2aWV3RGVjayA/IChjdXJyZW50SW5kZXggKyAxKSA6IGN1cnJlbnRJbmRleDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNsaWRlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgc2xpZGVzW2ldLmNsZWFyU3RhdHVzKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2xpZGVzW2N1cnJlbnRJbmRleExvY2FsXS5zZXRTdGF0dXMoJ2N1cnJlbnQnKTtcbiAgICAgICAgdmFyIG5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKSxcbiAgICAgICAgICAgIHByZXZJbmRleCA9IGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRJbmRleExvY2FsKTtcbiAgICAgICAgaWYgKG5leHRJbmRleCAhPT0gY3VycmVudEluZGV4TG9jYWwpIHtcbiAgICAgICAgICAgIHNsaWRlc1tuZXh0SW5kZXhdLnNldFN0YXR1cygnbmV4dCcpO1xuICAgICAgICAgICAgdmFyIG5leHROZXh0SW5kZXggPSBnZXROZXh0U2xpZGVJbmRleChuZXh0SW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHROZXh0SW5kZXggIT09IG5leHRJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1tuZXh0TmV4dEluZGV4XS5zZXRTdGF0dXMoJ25leHQtbmV4dCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2SW5kZXggIT09IGN1cnJlbnRJbmRleExvY2FsKSB7XG4gICAgICAgICAgICBzbGlkZXNbcHJldkluZGV4XS5zZXRTdGF0dXMoJ3ByZXYnKTtcbiAgICAgICAgICAgIHZhciBwcmV2UHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgocHJldkluZGV4KTtcbiAgICAgICAgICAgIGlmIChwcmV2UHJldkluZGV4ICE9PSBwcmV2SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzbGlkZXNbcHJldlByZXZJbmRleF0uc2V0U3RhdHVzKCdwcmV2LXByZXYnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5leHRTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCArIDEgPj0gc2xpZGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHNsaWRlcy5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFByZXZTbGlkZUluZGV4KGN1cnJlbnRTbGlkZUluZGV4KSB7XG4gICAgICAgIGlmIChjdXJyZW50U2xpZGVJbmRleCA8PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U2xpZGVJbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGV4cG9ydHMgPSB7fSxcbiAgICAgICAgc2lkZWJhcixcbiAgICAgICAgZWxlbWVudHNMaXN0LFxuICAgICAgICBHb3Rvc2xpZGUgPSByZXF1aXJlKCcuL2dvdG9zbGlkZScpLFxuICAgICAgICBQcmVzZW50YXRpb25Db25uZWN0b3IgPSByZXF1aXJlKCcuL3ByZXNlbnRhdGlvbi1jb25uZWN0b3InKSxcbiAgICAgICAgZWxlbWVudHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdTcGVha2VydmlldycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3NwZWFrZXJ2aWV3LycgKyBwcmVzZW50YXRpb24uZ2V0TmFtZSgpLFxuICAgICAgICAgICAgICAgIHRhcmdldDogJ19ibGFuaycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNjcmVlbidcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdHbyB0byBzbGlkZScsXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBuZWVkcyB0byBiZWNvbWUgbW9yZSBnZW5lcmljXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBuZXcgR290b3NsaWRlKHByZXNlbnRhdGlvbikudG9nZ2xlLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1zZWFyY2gnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnQ29ubmVjdCB0byBzZXNzaW9uJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246IG5ldyBQcmVzZW50YXRpb25Db25uZWN0b3IocHJlc2VudGF0aW9uKS50b2dnbGUsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLWRpc2Nvbm5lY3RlZCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdCcm93c2UgUHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnL3ByZXNlbnRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbi1tZW51J1xuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBzbGlkZUNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKTtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIHNldEJhc2VFbGVtZW50cygpO1xuICAgICAgICBzZXRFbGVtZW50cygpO1xuICAgICAgICBzZXRMaXN0ZW5lcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEJhc2VFbGVtZW50cygpIHtcbiAgICAgICAgc2lkZWJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FzaWRlJyk7XG4gICAgICAgIHNpZGViYXIuaWQgPSAnc2lkZWJhcic7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnc2lkZWJhcicpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNpZGViYXIpO1xuICAgICAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMScpO1xuICAgICAgICB2YXIgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBhbmNob3IuaHJlZiA9ICcvJztcbiAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICAgICAgbGFiZWwuY2xhc3NMaXN0LmFkZCgnbGFiZWwnLCAnaWNvbi1wcmVzZW50cicpO1xuICAgICAgICBhbmNob3IuaW5uZXJIVE1MID0gJ3ByZXNlbnRyJztcbiAgICAgICAgc2lkZWJhci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0RWxlbWVudHMoKSB7XG4gICAgICAgIGVsZW1lbnRzTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgICAgIHNpZGViYXIuYXBwZW5kQ2hpbGQoZWxlbWVudHNMaXN0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaXN0SXRlbS5hcHBlbmRDaGlsZChhbmNob3IpO1xuICAgICAgICAgICAgYW5jaG9yLmlubmVySFRNTCA9IGVsZW1lbnRzW2ldLmxhYmVsO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50c1tpXS5hY3Rpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmhyZWYgPSBlbGVtZW50c1tpXS5hY3Rpb247XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50c1tpXS50YXJnZXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuY2hvci50YXJnZXQgPSBlbGVtZW50c1tpXS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuaHJlZiA9ICcnO1xuICAgICAgICAgICAgICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGVsZW1lbnRzW2ldLmFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnRzW2ldLmNsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5jbGFzc0xpc3QuYWRkKGVsZW1lbnRzW2ldLmNsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnRzTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRMaXN0ZW5lcigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBob3RLZXkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhvdEtleShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gNzcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMudG9nZ2xlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2lkZWJhci5jbGFzc0xpc3QuY29udGFpbnMoJ29wZW4nKSkge1xuICAgICAgICAgICAgZXhwb3J0cy5jbG9zZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpZGViYXIuY2xhc3NMaXN0LmFkZCgnb3BlbicpO1xuICAgICAgICBzbGlkZUNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9mZkNsaWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb2ZmQ2xpY2soKSB7XG4gICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgc2xpZGVDb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvZmZDbGljayk7XG4gICAgfVxuXG4gICAgZXhwb3J0cy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTtcbiAgICB9O1xuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2xpZGVFbGVtZW50KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGN1cnJlbnRTdGF0dXMgPSB7fSxcbiAgICAgICAgaGVhZGxpbmU7XG5cbiAgICBleHBvcnRzLnNldFN0YXR1cyA9IGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICBzbGlkZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChzdGF0dXMpO1xuICAgICAgICBjdXJyZW50U3RhdHVzW3N0YXR1c10gPSBzdGF0dXM7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xlYXJTdGF0dXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgc3RhdHVzIGluIGN1cnJlbnRTdGF0dXMpIHtcbiAgICAgICAgICAgIHNsaWRlRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHN0YXR1cyk7XG4gICAgICAgICAgICBkZWxldGUgY3VycmVudFN0YXR1c1tzdGF0dXNdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0SGVhZGxpbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBoZWFkbGluZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSBzbGlkZUVsZW1lbnQuaW5uZXJIVE1MLm1hdGNoKC88aDEuKj4oLiopPFxcL2gxPi8pO1xuICAgICAgICAgICAgaGVhZGxpbmUgPSBzZWFyY2hbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlYWRsaW5lO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldERvbU5vZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNsaWRlRWxlbWVudDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsInZhciBwcmVzZW50YXRpb25zID0gW107XG5cbmV4cG9ydHMucmVnaXN0ZXJQcmVzZW50YXRpb24gPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICBwcmVzZW50YXRpb25zLmFkZChwcmVzZW50YXRpb24pO1xufTtcblxuZXhwb3J0cy5zZXRSYXRpbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICBhc3BlY3RSYXRpbyA9IDQvMztcbiAgICBpZiAod2luZG93LmlubmVyV2lkdGggPiB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoICogYXNwZWN0UmF0aW87XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgfVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmZvbnRTaXplID0gKGhlaWdodCAqIDAuMDAyKSArICdlbSc7XG59OyJdfQ==
