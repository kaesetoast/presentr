exports.getContentFrom = function(filePath, callback) {
    'use strict';
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            callback.call(callback, xmlhttp.responseText);
        }
    };
    xmlhttp.open('POST', filePath ,true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.send();
};