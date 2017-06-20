'use strict';


function cifParser(value) {
    let lines = value.split(/[\r\n]+/);
    let result = {};
    let newLines = [];
    let inLoopHeader = false;

    for (let line of lines) {
        if (line.match(/^ *#/)) { // a comment

        } else if (line.match(/^ *loop_/)) {
            inLoopHeader = true;
            newLines[newLines.length] = line.trim();
        } else if (line.match(/^ *_/)) {
            if (inLoopHeader) {
                newLines[newLines.length - 1] += ' ' + line.trim();
            } else {
                newLines[newLines.length] = line.trim();
            }
        } else {
            if (inLoopHeader) {
                inLoopHeader = false;
            }
            if (line.match(/^ *;/)) {
                newLines[newLines.length - 1] += ' ' + line.replace(';', "'").trim();
            } else {
                newLines[newLines.length - 1] += ' ' + line.trim();
            }
        }
    }

    for (let i = 0; i < newLines.length; i++) {
        var line = newLines[i] + ' ';
        var begin = 0;
        var inQuote = false;
        var escaped = false;
        var fields = [];
        for (var j = 0; j < line.length; j++) {
            var char = line.charAt(j);
            if (char === ' ' || char === '\t') {
                if (!inQuote) {
                    if (begin < j) {
                        fields.push(line.substring(begin, j));
                    }
                    begin = j + 1;
                }
            } else if (char === "'") {
                if (!escaped) {
                    if (inQuote) { // the end of the Quote
                        fields.push(line.substring(begin, j));
                        inQuote = false;
                    } else {
                        inQuote = true;
                    }
                    begin = j + 1;
                }
            }
            if (char === '\\') {
                escaped = true;
            } else {
                escaped = false;
            }
        }
        processFields(fields, result);
    }

    return result;

    function processFields(fields, result) {
        if (fields[0] === 'loop_') {
            // it is an array of object
            var headers = [];
            var lines = [];
            var i = 1;
            while (i < fields.length) {
                if (fields[i].match(/^_/)) {
                    headers.push(fields[i]);
                } else {
                    break;
                }
                i++;
            }

            var common = getCommonBeginning(headers).replace(/_$/, '');

            while (i < fields.length) {
                var pos = (i - 1) % headers.length;
                if (pos === 0) {
                    var line = {};
                }
                line[headers[pos]] = fields[i];
                if (pos === (headers.length - 1)) {
                    lines.push(line);
                }
                i++;
            }
            result[common] = lines;
        } else {
            result[fields[0]] = fields[1] ? unescapeValue(fields[1].trim()) : fields[1];
        }
    }

    function unescapeValue(value) {

        value = value.replace(/\\'e/g, 'Ã©');
        return value;
    }

    function getCommonBeginning(strings) {
        var common = '';
        var currentPosition = 0;
        while (currentPosition < strings[0].length) {
            var currentChar = strings[0].charAt(currentPosition);
            for (var i = 1; i < strings.length; i++) {
                if (strings[i].charAt(currentPosition) !== currentChar) {
                    return common;
                }
            }
            common += currentChar;
            currentPosition++;
        }
        return common;
    }
}

module.exports = {
    parse: cifParser
};

