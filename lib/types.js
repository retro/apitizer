var TYPES = ['string', 'integer', 'decimal', 'boolean', 'composite', 'number', 'randexp', 'array', 'autoincrement'],
	fn = function(_forEach, _toArray, formats){
		var startAt = fn.length,
			args = _toArray(arguments).slice(startAt, arguments.length);
			types = {};

		_forEach(TYPES, function(type, i){
			types[type] = args[i];
		});

		types.formats = formats;

		return types;
	}

define([
'lodash/collections/forEach',
'lodash/collections/toArray',
'lib/types/formats/formats',
'lib/types/string',
'lib/types/integer',
'lib/types/decimal',
'lib/types/boolean',
'lib/types/composite',
'lib/types/number',
'lib/types/randexp',
'lib/types/array',
'lib/types/autoincrement'],
fn);