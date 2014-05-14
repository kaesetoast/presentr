(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var presentationModule = require('./presentation'),
    viewportObserver = require('./viewport-observer'),
    sidebar = require('./sidebar'),
    presentationName = document.body.getAttribute('data-presentation'),
    isPreviewDeck = window.location.href.indexOf('/preview', window.location.href.length - 8) > 0;

window.presentation = new presentationModule(document.getElementsByClassName('slide'), presentationName, isPreviewDeck);
new sidebar(window.presentation);

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
},{"./presentation":4,"./sidebar":5,"./viewport-observer":7}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
            socket = io.connect('http://localhost');
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
},{"./slide":6}],5:[function(require,module,exports){
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
        ];

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
    };

    exports.close = function() {
        sidebar.classList.remove('open');
    };

    init();

    return exports;
};
},{"./gotoslide":2,"./presentation-connector":3}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdmFyL3d3dy9wcmVzZW50ci9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3Zhci93d3cvcHJlc2VudHIvY2xpZW50L2FwcC5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9nb3Rvc2xpZGUuanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvcHJlc2VudGF0aW9uLWNvbm5lY3Rvci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9wcmVzZW50YXRpb24uanMiLCIvdmFyL3d3dy9wcmVzZW50ci9jbGllbnQvc2lkZWJhci5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC9zbGlkZS5qcyIsIi92YXIvd3d3L3ByZXNlbnRyL2NsaWVudC92aWV3cG9ydC1vYnNlcnZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwcmVzZW50YXRpb25Nb2R1bGUgPSByZXF1aXJlKCcuL3ByZXNlbnRhdGlvbicpLFxuICAgIHZpZXdwb3J0T2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3ZpZXdwb3J0LW9ic2VydmVyJyksXG4gICAgc2lkZWJhciA9IHJlcXVpcmUoJy4vc2lkZWJhcicpLFxuICAgIHByZXNlbnRhdGlvbk5hbWUgPSBkb2N1bWVudC5ib2R5LmdldEF0dHJpYnV0ZSgnZGF0YS1wcmVzZW50YXRpb24nKSxcbiAgICBpc1ByZXZpZXdEZWNrID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignL3ByZXZpZXcnLCB3aW5kb3cubG9jYXRpb24uaHJlZi5sZW5ndGggLSA4KSA+IDA7XG5cbndpbmRvdy5wcmVzZW50YXRpb24gPSBuZXcgcHJlc2VudGF0aW9uTW9kdWxlKGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NsaWRlJyksIHByZXNlbnRhdGlvbk5hbWUsIGlzUHJldmlld0RlY2spO1xubmV3IHNpZGViYXIod2luZG93LnByZXNlbnRhdGlvbik7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGlmIChlLmtleUNvZGUgPT09IDM3KSB7XG4gICAgICAgIHdpbmRvdy5wcmVzZW50YXRpb24ucHJldigpO1xuICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09PSAzOSkge1xuICAgICAgICB3aW5kb3cucHJlc2VudGF0aW9uLm5leHQoKTtcbiAgICB9XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHZpZXdwb3J0T2JzZXJ2ZXIuc2V0UmF0aW8pO1xudmlld3BvcnRPYnNlcnZlci5zZXRSYXRpbygpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocHJlc2VudGF0aW9uKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIHNlYXJjaFdyYXBwZXIsXG4gICAgICAgIHNlYXJjaElucHV0LFxuICAgICAgICBzbGlkZUhlYWRsaW5lLFxuICAgICAgICBpc09wZW4gPSBmYWxzZSxcbiAgICAgICAgc2xpZGVzO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2xpZGVzID0gcHJlc2VudGF0aW9uLmdldFNsaWRlcygpO1xuICAgICAgICBzZXRCYXNlRWxlbWVudHMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCYXNlRWxlbWVudHMoKSB7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWN0aW9uJyk7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnZ290b3NsaWRlJyk7XG4gICAgICAgIHNlYXJjaElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgc2VhcmNoSW5wdXQudHlwZSA9ICdudW1iZXInO1xuICAgICAgICBzZWFyY2hJbnB1dC5taW4gPSAxO1xuICAgICAgICBzZWFyY2hJbnB1dC5tYXggPSBzbGlkZXMubGVuZ3RoO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmFwcGVuZENoaWxkKHNlYXJjaElucHV0KTtcbiAgICAgICAgc2xpZGVIZWFkbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgc2xpZGVIZWFkbGluZS5jbGFzc0xpc3QuYWRkKCdzbGlkZS1oZWFkbGluZScpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLmFwcGVuZENoaWxkKHNsaWRlSGVhZGxpbmUpO1xuICAgICAgICBzbGlkZUhlYWRsaW5lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZ29Ub1NlbGVjdGVkU2xpZGUpO1xuICAgIH1cblxuICAgIGV4cG9ydHMub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2VhcmNoV3JhcHBlciwgZXZlbnQuY3VycmVudFRhcmdldC5uZXh0U2libGluZyk7XG4gICAgICAgIHNlYXJjaFdyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmaXJlKTtcbiAgICAgICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBzZXRTbGlkZUhlYWRsaW5lKTtcbiAgICAgICAgc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgc2V0U2xpZGVIZWFkbGluZSk7XG4gICAgICAgIHNlYXJjaElucHV0LnZhbHVlID0gcHJlc2VudGF0aW9uLmdldEN1cnJlbnRTbGlkZUluZGV4KCkgKyAxO1xuICAgICAgICBzZXRTbGlkZUhlYWRsaW5lKCk7XG4gICAgICAgIGlzT3BlbiA9IHRydWU7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VhcmNoV3JhcHBlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNlYXJjaFdyYXBwZXIpO1xuICAgICAgICBzZWFyY2hXcmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZmlyZSk7XG4gICAgICAgIGlzT3BlbiA9IGZhbHNlO1xuICAgIH07XG5cbiAgICBleHBvcnRzLnRvZ2dsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChpc09wZW4pIHtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoZXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5vcGVuKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzZXRTbGlkZUhlYWRsaW5lKCkge1xuICAgICAgICBzbGlkZUhlYWRsaW5lLmlubmVySFRNTCA9IHNsaWRlc1tzZWFyY2hJbnB1dC52YWx1ZSAtIDFdLmdldEhlYWRsaW5lKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ29Ub1NlbGVjdGVkU2xpZGUoKSB7XG4gICAgICAgIHByZXNlbnRhdGlvbi5nb1RvKHNlYXJjaElucHV0LnZhbHVlIC0gMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZShldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgIGdvVG9TZWxlY3RlZFNsaWRlKCk7XG4gICAgICAgICAgICBleHBvcnRzLmNsb3NlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9O1xuXG4gICAgZXhwb3J0cy50b2dnbGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAocHJlc2VudGF0aW9uLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgICAgIHByZXNlbnRhdGlvbi5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2ljb24tY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2ljb24tZGlzY29ubmVjdGVkJyk7XG4gICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LmlubmVySFRNTCA9ICdDb25uZWN0IHRvIHNlc3Npb24nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlc2VudGF0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgnaWNvbi1kaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuY2xhc3NMaXN0LmFkZCgnaWNvbi1jb25uZWN0ZWQnKTtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuaW5uZXJIVE1MID0gJ0Rpc2Nvbm5lY3QgZnJvbSBzZXNzaW9uJztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZXhwb3J0cztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzbGlkZUVsZW1lbnRzLCBuYW1lLCBpc1ByZXZpZXdEZWNrKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGN1cnJlbnRJbmRleCA9IDAsXG4gICAgICAgIHNvY2tldCxcbiAgICAgICAgU2xpZGUgPSByZXF1aXJlKCcuL3NsaWRlJyksXG4gICAgICAgIHNsaWRlcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgaW5pdFNsaWRlcygpO1xuICAgICAgICBpZiAoaXNQcmV2aWV3RGVjaykge1xuICAgICAgICAgICAgYWRkRW5kU2xpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2ggIT09ICcnKSB7XG4gICAgICAgICAgICBoYXNoQ2hhbmdlZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cy5nb1RvKDApO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgaGFzaENoYW5nZWQpO1xuICAgIH1cblxuICAgIGV4cG9ydHMubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMucHJldiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBvcnRzLmdvVG8oZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4KSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0Q3VycmVudFNsaWRlSW5kZXggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nb1RvID0gZnVuY3Rpb24oc2xpZGVJbmRleCwgcmVtb3RlSW52b2tlZCkge1xuICAgICAgICBpZiAoc2xpZGVzLmxlbmd0aCA+IHNsaWRlSW5kZXgpIHtcbiAgICAgICAgICAgIGlmICghcmVtb3RlSW52b2tlZCAmJiB0eXBlb2Ygc29ja2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KCdnb3RvLXNsaWRlJywge3ByZXNlbnRhdGlvbk5hbWU6IG5hbWUsIHNsaWRlOiBzbGlkZUluZGV4fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggPSBzbGlkZUluZGV4O1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBjdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgc2V0U2xpZGVzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXRTbGlkZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNsaWRlcztcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5nZXROYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmlzQ29ubmVjdGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygc29ja2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzb2NrZXQuc29ja2V0LmNvbm5lY3RlZDtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc29ja2V0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8uY29ubmVjdCgnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgICAgc29ja2V0Lm9uKCdnb3RvLXNsaWRlJywgZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy5nb1RvKGRhdGEsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb2NrZXQuc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBzb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7cHJlc2VudGF0aW9uOiBuYW1lfSk7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpbml0U2xpZGVzKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWRlRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNsaWRlcy5wdXNoKG5ldyBTbGlkZShzbGlkZUVsZW1lbnRzW2ldKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNoQ2hhbmdlZCgpIHtcbiAgICAgICAgZXhwb3J0cy5nb1RvKHBhcnNlSW50KHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSkgLSAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRFbmRTbGlkZSgpIHtcbiAgICAgICAgdmFyIGFydGljbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhcnRpY2xlJyk7XG4gICAgICAgIGFydGljbGUuY2xhc3NMaXN0LmFkZCgnc2xpZGUnLCAnZW5kJyk7XG4gICAgICAgIHNsaWRlc1tzbGlkZXMubGVuZ3RoLTFdLmdldERvbU5vZGUoKS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShhcnRpY2xlLCBzbGlkZXNbc2xpZGVzLmxlbmd0aC0xXS5uZXh0U2libGluZyk7XG4gICAgICAgIHNsaWRlcy5wdXNoKG5ldyBTbGlkZShhcnRpY2xlKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0U2xpZGVzKCkge1xuICAgICAgICB2YXIgY3VycmVudEluZGV4TG9jYWwgPSBpc1ByZXZpZXdEZWNrID8gKGN1cnJlbnRJbmRleCArIDEpIDogY3VycmVudEluZGV4O1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBzbGlkZXNbaV0uY2xlYXJTdGF0dXMoKTtcbiAgICAgICAgfVxuICAgICAgICBzbGlkZXNbY3VycmVudEluZGV4TG9jYWxdLnNldFN0YXR1cygnY3VycmVudCcpO1xuICAgICAgICB2YXIgbmV4dEluZGV4ID0gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpLFxuICAgICAgICAgICAgcHJldkluZGV4ID0gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudEluZGV4TG9jYWwpO1xuICAgICAgICBpZiAobmV4dEluZGV4ICE9PSBjdXJyZW50SW5kZXhMb2NhbCkge1xuICAgICAgICAgICAgc2xpZGVzW25leHRJbmRleF0uc2V0U3RhdHVzKCduZXh0Jyk7XG4gICAgICAgICAgICB2YXIgbmV4dE5leHRJbmRleCA9IGdldE5leHRTbGlkZUluZGV4KG5leHRJbmRleCk7XG4gICAgICAgICAgICBpZiAobmV4dE5leHRJbmRleCAhPT0gbmV4dEluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2xpZGVzW25leHROZXh0SW5kZXhdLnNldFN0YXR1cygnbmV4dC1uZXh0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZJbmRleCAhPT0gY3VycmVudEluZGV4TG9jYWwpIHtcbiAgICAgICAgICAgIHNsaWRlc1twcmV2SW5kZXhdLnNldFN0YXR1cygncHJldicpO1xuICAgICAgICAgICAgdmFyIHByZXZQcmV2SW5kZXggPSBnZXRQcmV2U2xpZGVJbmRleChwcmV2SW5kZXgpO1xuICAgICAgICAgICAgaWYgKHByZXZQcmV2SW5kZXggIT09IHByZXZJbmRleCkge1xuICAgICAgICAgICAgICAgIHNsaWRlc1twcmV2UHJldkluZGV4XS5zZXRTdGF0dXMoJ3ByZXYtcHJldicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TmV4dFNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4ICsgMSA+PSBzbGlkZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gc2xpZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFNsaWRlSW5kZXggKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UHJldlNsaWRlSW5kZXgoY3VycmVudFNsaWRlSW5kZXgpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRTbGlkZUluZGV4IDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTbGlkZUluZGV4IC0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBleHBvcnRzO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHByZXNlbnRhdGlvbikge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZXhwb3J0cyA9IHt9LFxuICAgICAgICBzaWRlYmFyLFxuICAgICAgICBlbGVtZW50c0xpc3QsXG4gICAgICAgIEdvdG9zbGlkZSA9IHJlcXVpcmUoJy4vZ290b3NsaWRlJyksXG4gICAgICAgIFByZXNlbnRhdGlvbkNvbm5lY3RvciA9IHJlcXVpcmUoJy4vcHJlc2VudGF0aW9uLWNvbm5lY3RvcicpLFxuICAgICAgICBlbGVtZW50cyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ1NwZWFrZXJ2aWV3JyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICcvc3BlYWtlcnZpZXcvJyArIHByZXNlbnRhdGlvbi5nZXROYW1lKCksXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnX2JsYW5rJyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tc2NyZWVuJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0dvIHRvIHNsaWRlJyxcbiAgICAgICAgICAgICAgICAvLyBUaGlzIG5lZWRzIHRvIGJlY29tZSBtb3JlIGdlbmVyaWNcbiAgICAgICAgICAgICAgICBhY3Rpb246IG5ldyBHb3Rvc2xpZGUocHJlc2VudGF0aW9uKS50b2dnbGUsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLXNlYXJjaCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdDb25uZWN0IHRvIHNlc3Npb24nLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogbmV3IFByZXNlbnRhdGlvbkNvbm5lY3RvcihwcmVzZW50YXRpb24pLnRvZ2dsZSxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24tZGlzY29ubmVjdGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0Jyb3dzZSBQcmVzZW50YXRpb25zJyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICcvcHJlc2VudGF0aW9ucycsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uLW1lbnUnXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG5cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBzZXRCYXNlRWxlbWVudHMoKTtcbiAgICAgICAgc2V0RWxlbWVudHMoKTtcbiAgICAgICAgc2V0TGlzdGVuZXIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRCYXNlRWxlbWVudHMoKSB7XG4gICAgICAgIHNpZGViYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhc2lkZScpO1xuICAgICAgICBzaWRlYmFyLmlkID0gJ3NpZGViYXInO1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ3NpZGViYXInKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzaWRlYmFyKTtcbiAgICAgICAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgICAgICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgYW5jaG9yLmhyZWYgPSAnLyc7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKGFuY2hvcik7XG4gICAgICAgIGxhYmVsLmNsYXNzTGlzdC5hZGQoJ2xhYmVsJywgJ2ljb24tcHJlc2VudHInKTtcbiAgICAgICAgYW5jaG9yLmlubmVySFRNTCA9ICdwcmVzZW50cic7XG4gICAgICAgIHNpZGViYXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldEVsZW1lbnRzKCkge1xuICAgICAgICBlbGVtZW50c0xpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgICAgICBzaWRlYmFyLmFwcGVuZENoaWxkKGVsZW1lbnRzTGlzdCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgICAgICB2YXIgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgbGlzdEl0ZW0uYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICAgICAgICAgIGFuY2hvci5pbm5lckhUTUwgPSBlbGVtZW50c1tpXS5sYWJlbDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0uYWN0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGFuY2hvci5ocmVmID0gZWxlbWVudHNbaV0uYWN0aW9uO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudHNbaV0udGFyZ2V0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBhbmNob3IudGFyZ2V0ID0gZWxlbWVudHNbaV0udGFyZ2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5jaG9yLmhyZWYgPSAnJztcbiAgICAgICAgICAgICAgICBhbmNob3IuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbGVtZW50c1tpXS5hY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50c1tpXS5jbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBhbmNob3IuY2xhc3NMaXN0LmFkZChlbGVtZW50c1tpXS5jbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50c0xpc3QuYXBwZW5kQ2hpbGQobGlzdEl0ZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0TGlzdGVuZXIoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgaG90S2V5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBob3RLZXkoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDc3KSB7XG4gICAgICAgICAgICBleHBvcnRzLnRvZ2dsZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXhwb3J0cy50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHNpZGViYXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuY2xvc2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMub3BlbigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoJ29wZW4nKTtcbiAgICB9O1xuXG4gICAgZXhwb3J0cy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzaWRlYmFyLmNsYXNzTGlzdC5yZW1vdmUoJ29wZW4nKTtcbiAgICB9O1xuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2xpZGVFbGVtZW50KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBleHBvcnRzID0ge30sXG4gICAgICAgIGN1cnJlbnRTdGF0dXMgPSB7fSxcbiAgICAgICAgaGVhZGxpbmU7XG5cbiAgICBleHBvcnRzLnNldFN0YXR1cyA9IGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICBzbGlkZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChzdGF0dXMpO1xuICAgICAgICBjdXJyZW50U3RhdHVzW3N0YXR1c10gPSBzdGF0dXM7XG4gICAgfTtcblxuICAgIGV4cG9ydHMuY2xlYXJTdGF0dXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgc3RhdHVzIGluIGN1cnJlbnRTdGF0dXMpIHtcbiAgICAgICAgICAgIHNsaWRlRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKHN0YXR1cyk7XG4gICAgICAgICAgICBkZWxldGUgY3VycmVudFN0YXR1c1tzdGF0dXNdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuZ2V0SGVhZGxpbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBoZWFkbGluZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHZhciBzZWFyY2ggPSBzbGlkZUVsZW1lbnQuaW5uZXJIVE1MLm1hdGNoKC88aDEuKj4oLiopPFxcL2gxPi8pO1xuICAgICAgICAgICAgaGVhZGxpbmUgPSBzZWFyY2hbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlYWRsaW5lO1xuICAgIH07XG5cbiAgICBleHBvcnRzLmdldERvbU5vZGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNsaWRlRWxlbWVudDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGV4cG9ydHM7XG59OyIsInZhciBwcmVzZW50YXRpb25zID0gW107XG5cbmV4cG9ydHMucmVnaXN0ZXJQcmVzZW50YXRpb24gPSBmdW5jdGlvbihwcmVzZW50YXRpb24pIHtcbiAgICBwcmVzZW50YXRpb25zLmFkZChwcmVzZW50YXRpb24pO1xufTtcblxuZXhwb3J0cy5zZXRSYXRpbyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICBhc3BlY3RSYXRpbyA9IDQvMztcbiAgICBpZiAod2luZG93LmlubmVyV2lkdGggPiB3aW5kb3cuaW5uZXJIZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoICogYXNwZWN0UmF0aW87XG4gICAgICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgfVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbGlkZS1jb250YWluZXInKS5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2xpZGUtY29udGFpbmVyJykuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmZvbnRTaXplID0gKGhlaWdodCAqIDAuMDAyKSArICdlbSc7XG59OyJdfQ==
