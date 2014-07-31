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