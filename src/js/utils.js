;

MblRdr.Utils = function() {
    "use strict";

    function htmlDecode(encoded) {
        var div = document.createElement('div');
        div.innerHTML = encoded;
        return div.firstChild.nodeValue;
    }

    function htmlEncode(value) {
        return !value ? value : String(value).replace(/&/g, "&amp;").replace(/\'/g, "&#39;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    return {
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    }
}();
