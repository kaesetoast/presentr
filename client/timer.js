module.exports = function(container, endTime) {
    'use strict';
    var exports = {},
        timer,
        timeBox,
        toggleButton,
        resetButton,
        totalSeconds = 0,
        interval = null;

    function init() {
        timer = document.createElement('div');
        timeBox = document.createElement('span');
        timeBox.classList.add('time-box');
        container.appendChild(timer);
        timer.appendChild(timeBox);
        toggleButton = document.createElement('a');
        toggleButton.classList.add('toggle-button', 'icon', 'icon-play');
        timer.appendChild(toggleButton);
        toggleButton.addEventListener('click', toggleClick);
        resetButton = document.createElement('a');
        resetButton.innerHTML = 'reset';
        resetButton.classList.add('reset-button');
        timer.appendChild(resetButton);
        resetButton.addEventListener('click', resetClick);
        updateTimeBox();
    }

    function updateTimeBox() {
        var seconds = totalSeconds % 60,
            minutes = parseInt(totalSeconds / 60),
            hours = parseInt(totalSeconds / 3600);
        seconds = seconds > 9 ? seconds : '0' + seconds;
        minutes = minutes > 9 ? minutes : '0' + minutes;
        hours = hours > 9 ? hours : '0' + hours;
        timeBox.innerHTML = hours + ':' +  minutes + ':' + seconds;
        if (totalSeconds + 60 > endTime && !timeBox.classList.contains('lastminute')) {
            timeBox.classList.add('lastminute');
        }
        if (totalSeconds > endTime && !timeBox.classList.contains('overtime')) {
            timeBox.classList.add('overtime');
        }
    }

    function tick() {
        totalSeconds++;
        updateTimeBox();
    }

    function resetClick(e) {
        e.preventDefault();
        exports.reset();
    }

    function toggleClick(e) {
        e.preventDefault();
        if (interval === null) {
            exports.start();
        } else {
            exports.pause();
        }
    }

    exports.start = function() {
        interval = setInterval(tick, 1000);
        toggleButton.classList.remove('icon-play');
        toggleButton.classList.add('icon-pause');
    };

    exports.pause = function() {
        clearInterval(interval);
        interval = null;
        toggleButton.classList.remove('icon-pause');
        toggleButton.classList.add('icon-play');
    };

    exports.reset = function() {
        exports.pause();
        totalSeconds = 0;
        updateTimeBox();
    };

    init();

    return exports;
};