module.exports = function(presentationName) {
    'use strict';
    var exports = {},
        sidebar,
        elementsList,
        elements = [
            {
                label: 'Speakerview',
                action: '/speakerview/' + presentationName,
                target: '_blank',
                class: 'icon-screen'
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
        label.classList.add('label');
        label.innerHTML = 'presentr';
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