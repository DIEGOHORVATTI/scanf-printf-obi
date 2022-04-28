// scanf-printf-obi
// v0.1
// scanf and printf for tasks
// OBI - Brazilian Olympiad in Informatics

var fs = require('fs'),
    stdin = process.stdin;


module.exports = {
    scanf: scanf,
    sprintf: sprintf,
    fgets: fgets
}


// *********************
// functions for printf
// *********************

var re = {
        not_string: /[^s]/,
        number: /[dief]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fiosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
	}

function sprintf() {
    var key = arguments[0], cache = sprintf.cache
    if (!(cache[key] && cache.hasOwnProperty(key))) {
        cache[key] = sprintf.parse(key)
    }
    return sprintf.format.call(null, cache[key], arguments)
}

sprintf.format = function(parse_tree, argv) {
    var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
    for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i])
        if (node_type === "string") {
            output[output.length] = parse_tree[i]
        }
        else if (node_type === "array") {
            match = parse_tree[i] // convenience purposes only
            if (match[2]) { // keyword argument
                arg = argv[cursor]
                for (k = 0; k < match[2].length; k++) {
                    if (!arg.hasOwnProperty(match[2][k])) {
                        throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                    }
                    arg = arg[match[2][k]]
                }
            }
            else if (match[1]) { // positional argument (explicit)
                arg = argv[match[1]]
            }
            else { // positional argument (implicit)
                arg = argv[cursor++]
            }

            if (get_type(arg) == "function") {
                arg = arg()
            }

            if (re.not_string.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
            }

            if (re.number.test(match[8])) {
                is_positive = arg >= 0
            }

            switch (match[8]) {
            case "b":
                arg = arg.toString(2)
                break
            case "c":
                arg = String.fromCharCode(arg)
                break
            case "d":
            case "i":
                arg = parseInt(arg, 10)
                break
            case "e":
                arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                break
            case "f":
                arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                break
            case "o":
                arg = arg.toString(8)
                break
            case "s":
                arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                break
            case "u":
                arg = arg >>> 0
                break
            case "x":
                arg = arg.toString(16)
                break
            case "X":
                arg = arg.toString(16).toUpperCase()
                break
            }
            if (re.number.test(match[8]) && (!is_positive || match[3])) {
                sign = is_positive ? "+" : "-"
                arg = arg.toString().replace(re.sign, "")
            }
            else {
                sign = ""
            }
            pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
            pad_length = match[6] - (sign + arg).length
            pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
            output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
        }
    }
    return output.join("")
}

sprintf.cache = {}

sprintf.parse = function(fmt) {
    var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
    while (_fmt) {
        if ((match = re.text.exec(_fmt)) !== null) {
            parse_tree[parse_tree.length] = match[0]
        }
        else if ((match = re.modulo.exec(_fmt)) !== null) {
            parse_tree[parse_tree.length] = "%"
        }
        else if ((match = re.placeholder.exec(_fmt)) !== null) {
            if (match[2]) {
                arg_names |= 1
                var field_list = [], replacement_field = match[2], field_match = []
                if ((field_match = re.key.exec(replacement_field)) !== null) {
                    field_list[field_list.length] = field_match[1]
                    while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                        if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                            field_list[field_list.length] = field_match[1]
                        }
                        else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                            field_list[field_list.length] = field_match[1]
                        }
                        else {
                            throw new SyntaxError("[sprintf] failed to parse named argument key")
                        }
                    }
                }
                else {
                    throw new SyntaxError("[sprintf] failed to parse named argument key")
                }
                match[2] = field_list
            }
            else {
                arg_names |= 2
            }
            if (arg_names === 3) {
                throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
            }
            parse_tree[parse_tree.length] = match
        }
        else {
            throw new SyntaxError("[sprintf] unexpected placeholder")
        }
        _fmt = _fmt.substring(match[0].length)
    }
    return parse_tree
}

var vsprintf = function(fmt, argv, _argv) {
    _argv = (argv || []).slice(0)
    _argv.splice(0, 0, fmt)
    return sprintf.apply(null, _argv)
}

/**
 * helpers
 */
function get_type(variable) {
    return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
}

function str_repeat(input, multiplier) {
    return Array(multiplier + 1).join(input)
}



// *********************
// functions for scanf
// *********************

// variables for keeping input context
var _current_input=fs.readFileSync('/dev/stdin').toString();
var _current_input_point=0;

function _format_error(s) {
    return("\n******************\n"+s+"\n******************\n\n");
}

function _translate(s) {
    if (s == 'scanf_error_while_reading')
	return(_format_error('erro durante a leitura'));
    else if (s == 'scanf_error_no_match')
	return(_format_error('erro nos parâmetros'));
    else if (s == 'scanf_error_not_enough_args')
	return(_format_error('faltam argumentos'));
    else if (s == 'scanf_error_all_groups_as_numeric')
	return(_format_error('todos os grupos como numéricos'));
    else if (s == 'scanf_error_unexpected_size')
	return(_format_error('tamanho inválido'));
    else if (s == 'scanf_error_missing_charac_after_percent')
	return(_format_error('caractere faltando ou inválido após símbolo percentagem'));
    else if (s == 'scanf_error_unrecognized_charac_after_percent')
	return(_format_error('caractere inválido após símbolo percentagem'));
    else if (s == 'fgets_error_only_one_argument')
	return(_format_error('fgets tem apenas um argumento'));
    else
	return(_format_error(s));
}

function scanf(format) {
    // based on original by Brett Zamir (http://brett-zamir.me)
    //  discuss at: http://phpjs.org/functions/sscanf/
    // original by: Brett Zamir (http://brett-zamir.me)
    //        note: Since JS does not support scalar reference variables, any additional arguments to the function will
    //        note: only be allowable here as strings referring to a global variable (which will then be set to the value
    //        note: found in 'str' corresponding to the appropriate conversion specification in 'format'
    //        note: I am unclear on how WS is to be handled here because documentation seems to me to contradict PHP behavior
    //   example 1: sscanf('SN/2350001', 'SN/%d');
    //   returns 1: [2350001]
    //   example 2: var myVar; // Will be set by function
    //   example 2: sscanf('SN/2350001', 'SN/%d', 'myVar');
    //   returns 2: 1
    //   example 3: sscanf("10--20", "%2$d--%1$d"); // Must escape '$' in PHP, but not JS
    //   returns 3: [20, 10]

    // SETUP
    var _retArr = [],
	num = 0,
	_NWS = /\S/,
	args = arguments,
	that = this,
	digit;

    var _str_input=_current_input;

    var _setExtraConversionSpecs = function (offset) {
	// Since a mismatched character sets us off track from future legitimate finds, we just scan
	// to the end for any other conversion specifications (besides a percent literal), setting them to null
	// sscanf seems to disallow all conversion specification components (of sprintf) except for type specifiers
	// Do not allow % in last char. class
	//var matches = format.match(/%[+-]?([ 0]|'.)?-?\d*(\.\d+)?[bcdeufFosxX]/g);
	var matches = format.slice(offset)
	    .match(/%[cdeEufgosxX]/g); // Do not allow % in last char. class;
	// b, F,G give errors in PHP, but 'g', though also disallowed, doesn't
	if (matches) {
	    var lgth = matches.length;
	    while (lgth--) {
		_retArr.push(null);
	    }
	}
	return _finish();
    };

    var _finish = function () {
	// prepare the expression to be evaluated at caller, using the variables passed as arguments,
	// to attribute the values read to the variables
	
	var eval_expr = '';
	if (args.length === 1) {
	    eval_expr = _retArr;
	    return eval_expr;
	}
	var _str,_tmp,_i;
	for (_i = 0; _i < _retArr.length; ++_i) {
	    if (typeof _retArr[_i] === 'number')
		_tmp = _retArr[_i].toString();
	    else if (typeof _retArr[_i] === 'string')
		_tmp = "'"+_formatStr(_retArr[_i])+"'";
	    else {
		throw new Error(_translate('scanf_error_while_reading'));
	    }
	    //_str="global."+args[_i+1]+'='+_tmp;
	    
	    _str = args[_i+1] + '=' + _tmp + ';\n';
	    //that.window[args[_i + 1]] = _retArr[_i];
	    //eval(_str);
	    eval_expr += _str
	    
	}
	return eval_expr;
    };

    var _addNext = function (j, regex, cb) {
	if (assign) {
	    var remaining = _str_input.slice(j);
	    var check = width ? remaining.substr(0, width) : remaining;
	    var match = regex.exec(check);
	    var testNull = _retArr[digit !== undefined ? digit : _retArr.length] = match ? (cb ? cb.apply(null, match) :
											    match[0]) : null;
	    
	    if (testNull === null) {
		throw new Error(_translate('scanf_error_no_match'));
	    }
	    return j + match[0].length;
	}
	return j;
    };

    if (arguments.length < 1) {
	throw new Error(_translate('scanf_error_not_enough_args'));
    }

    // PROCESS
    for (var i = 0; i < format.length; i++) {

	var width = 0,
	    assign = true;

	if (format.charAt(i) === '%') {
	    if (format.charAt(i + 1) === '%') {
		if (_str_input.charAt(_current_input_point) === '%') {
		    // a matched percent literal
		    // skip beyond duplicated percent
		    ++i, ++_current_input_point;
		    continue;
		}
		// Format indicated a percent literal, but not actually present
		return _setExtraConversionSpecs(i + 2);
	    }

	    // CHARACTER FOLLOWING PERCENT IS NOT A PERCENT

	    // We need 'g' set to get lastIndex
	    var prePattern = new RegExp('^(?:(\\d+)\\$)?(\\*)?(\\d*)([hlL]?)', 'g');

	    var preConvs = prePattern.exec(format.slice(i + 1));
	    var tmpDigit = digit;
	    if (tmpDigit && preConvs[1] === undefined) {
		throw new Error(_translate('scanf_error_all_groups_as_numeric'));
	    }
	    digit = preConvs[1] ? parseInt(preConvs[1], 10) - 1 : undefined;

	    assign = !preConvs[2];
	    width = parseInt(preConvs[3], 10);
	    var sizeCode = preConvs[4];
	    i += prePattern.lastIndex;

	    // Fix: Does PHP do anything with these? Seems not to matter
	    if (sizeCode) {
		// This would need to be processed later
		switch (sizeCode) {
		case 'h':
		    // Treats subsequent as short int (for d,i,n) or unsigned short int (for o,u,x)
		case 'l':
		    // Treats subsequent as long int (for d,i,n), or unsigned long int (for o,u,x);
		    //    or as double (for e,f,g) instead of float or wchar_t instead of char
		case 'L':
		    // Treats subsequent as long double (for e,f,g)
		    break;
		default:
		    throw new Error (_translate('scanf_error_unexpected_size'));
		    break;
		}
	    }
	    // PROCESS CHARACTER
	    try {
		switch (format.charAt(i + 1)) {
		    // For detailed explanations, see http://web.archive.org/web/20031128125047/http://www.uwm.edu/cgi-bin/IMT/wwwman?topic=scanf%283%29&msection=
		    // Also http://www.mathworks.com/access/helpdesk/help/techdoc/ref/sscanf.html
		    // p, S, C arguments in C function not available
		    // DOCUMENTED UNDER SSCANF
		case 'F':
		    // Not supported in PHP sscanf; the argument is treated as a float, and
		    //  presented as a floating-point number (non-locale aware)
		    // sscanf doesn't support locales, so no need for two (see %f)
		    break;
		case 'g':
		    // Not supported in PHP sscanf; shorter of %e and %f
		    // Irrelevant to input conversion
		    break;
		case 'G':
		    // Not supported in PHP sscanf; shorter of %E and %f
		    // Irrelevant to input conversion
		    break;
		case 'b':
		    // Not supported in PHP sscanf; the argument is treated as an integer, and presented as a binary number
		    // Not supported - couldn't distinguish from other integers
		    break;
		case 'i':
		    // Integer with base detection (Equivalent of 'd', but base 0 instead of 10)
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:(?:0x([\da-fA-F]+))|(?:0([0-7]+))|(\d+))/, function (num, sign, hex,
																	     oct, dec) {
			return hex ? parseInt(num, 16) : oct ? parseInt(num, 8) : parseInt(num, 10);
		    });
		    break;
		case 'n':
		    // Number of characters processed so far
		    _retArr[digit !== undefined ? digit : _retArr.length - 1] = _current_input_point;
		    break;
		    // DOCUMENTED UNDER SPRINTF
		case 'c':
		    // Get character; suppresses skipping over whitespace! (but shouldn't be whitespace in format anyways, so no difference here)
		    // Non-greedy match
		    _current_input_point = _addNext(_current_input_point, new RegExp("(\\s|\\S){1," + (width || 1) + "}"));
		    break;
		case 'D':
		    // sscanf documented decimal number; equivalent of 'd';
		case 'd':
		    // Optionally signed decimal integer
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:0*)(\d+)/, function (num, sign, dec) {
			// Ignores initial zeroes, unlike %i and parseInt()
			var decInt = parseInt((sign || '') + dec, 10);
			if (decInt < 0) {
			    // PHP also won't allow less than -2147483648
			    // integer overflow with negative
			    return decInt < -2147483648 ? -2147483648 : decInt;
			} else {
			    // PHP also won't allow greater than -2147483647
			    return decInt < 2147483647 ? decInt : 2147483647;
			}
		    });
		    break;
		case 'f':
		    // Although sscanf doesn't support locales, this is used instead of '%F'; seems to be same as %e
		case 'E':
		    // These don't discriminate here as both allow exponential float of either case
		case 'e':
		    //_current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:0*)(\d*\.?\d*(?:[eE]?\d+)?)/, function (num, sign, dec) {
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(\d*\.?\d*(?:[eE]?\d+)?)/, function (num, sign, dec) {

			if (dec === '.') {
			    return null;
			}
			// Ignores initial zeroes, unlike %i and parseFloat()
			return parseFloat((sign || '') + dec);
		    });
		    break;
		case 'u':
		    // unsigned decimal integer
		    // We won't deal with integer overflows due to signs
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:0*)(\d+)/, function (num, sign, dec) {
			// Ignores initial zeroes, unlike %i and parseInt()
			var decInt = parseInt(dec, 10);
			if (sign === '-') {
			    // PHP also won't allow greater than 4294967295
			    // integer overflow with negative
			    return 4294967296 - decInt;
			} else {
			    return decInt < 4294967295 ? decInt : 4294967295;
			}
		    });
		    break;
		case 'o':
		    // Octal integer // Fix: add overflows as above?
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:0([0-7]+))/, function (num, sign, oct) {
			return parseInt(num, 8);
		    });
		    break;
		case 's':
		    // Greedy match
		    // _current_input_point = _addNext(_current_input_point, /\s*(\S+)/);
		    // ranido fixed
		    _current_input_point = _addNext(_current_input_point, /\s*(\S+)/, function (str) {
			return str.trim();
		    });
		    break;
		case 'X':
		    // Same as 'x'?
		case 'x':
		    // Fix: add overflows as above?
		    // Initial 0x not necessary here
		    _current_input_point = _addNext(_current_input_point, /\s*([+-])?(?:(?:0x)?([\da-fA-F]+))/, function (num, sign, hex) {
			return parseInt(num, 16);
		    });
		    break;
		case '':
		    // If no character left in expression
		    throw new Error(_translate('scanf_error_missing_charac_after_percent'));
		default:
		    throw new Error(_translate('scanf_error_unrecognized_charac_after_percent'));
		}
	    } catch (e) {
		if (e === 'No match in string\n') {
		    // Allow us to exit
		    return _setExtraConversionSpecs(i + 2);
		}
		// Calculate skipping beyond initial percent too
	    } ++i;
	} else if (format.charAt(i) !== _str_input.charAt(_current_input_point)) {
	    // Fix: Double-check i whitespace ignored in string and/or formats
	    _NWS.lastIndex = 0;
	    if ((_NWS) 
		.test(_str_input.charAt(_current_input_point)) || _str_input.charAt(_current_input_point) === '') {
		// Whitespace doesn't need to be an exact match)
		return _setExtraConversionSpecs(i + 1);
	    } else {
		// Adjust strings when encounter non-matching whitespace, so they align in future checks above
		// Ok to replace with j++;?
		_str_input = _str_input.slice(0, _current_input_point) + _str_input.slice(_current_input_point + 1);
		i--;
	    }
	} else {
	    _current_input_point++;
	}
    }

    // POST-PROCESSING
    return _finish();
}

function _formatStr(x) {
    return x.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"").replace(/\'/g, "\\\'").replace(/\n/g, "\\n");
}


function fgets(retVar) {
    //   example 1: var myVar; // Will be set by function
    //   example 1: fgets('myVar');
    // SETUP
    var args = arguments,
	fullLine = '',
	str=_current_input,
	start=_current_input_point,
	endlinePos = _current_input_point;

    //var remaining=str.slice(start);
    //endlinePos = remaining.search(/\r\n?|\n/) + start + 1;
    //fullline = str.slice(start, endlinePos + 1);
    //if (fullline === '') {
    //    fullline = str.slice(start); // get rest of the file
    //}

    if (arguments.length !== 1) 
	throw new Error(_translate('fgets_error_only_one_argument'));

    if (str.charAt(_current_input_point) == '\n') {
	++_current_input_point;
	endlinePos = _current_input_point;
    }
    while (true) {
	if (_current_input_point==str.length) {
	    break;
	}
	if (str.charAt(_current_input_point) === '\n') {
	    ++_current_input_point;
	    break;
	}
	++endlinePos, ++_current_input_point;
    }
    fullLine=_formatStr(str.slice(start,endlinePos));
    return retVar+"='"+fullLine+"'";
}

//versao Carlos Rafael
// function fgets(x) {
//     var i, r;
//     if (!_current_input || !_current_input.length || _current_input_point >= _current_input.length)
// 	throw new Error("[fgets] Fim da entrada encontrado");
//     i = _current_input.indexOf("\n", _current_input_point);
//     if (i < _current_input_point) {
// 	r = _current_input.substring(_current_input_point, _current_input.length);
// 	_current_input_point = _current_input.length;
// 	// self.eval(x + "=\"" + formatStr(r) + "\"");
// 	// return r.length;
// 	return (x + "=\"" + formatStr(r) + "\"");
//     }
//     if (i === _current_input_point) {
// 	_current_input_point++;
// 	//self.eval(x + "=\"\"");
// 	//return 0;
// 	return (x + "=\"\"");
//     }
//     r = _current_input.substring(_current_input_point, i);
//     _current_input_point = i + 1;
//     //self.eval(x + "=\"" + formatStr(r) + "\"");
//     //return r.length;
//     return (x + "=\"" + formatStr(r) + "\"");
// }
