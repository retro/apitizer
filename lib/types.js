var TYPES = ['string', 'integer', 'decimal', 'date', 'boolean', 'composite', 'number', 'randexp', 'array', 'autoincrement'],
	fn = function(_forEach, _toArray){
		var startAt = fn.length,
			args = _toArray(arguments).slice(startAt, arguments.length);
			types = {};

		_forEach(TYPES, function(type, i){
			types[type] = args[i];
		})

		window.types = types;

		return types;
	}

define([
'lodash/collections/forEach',
'lodash/collections/toArray',
'./types/string',
'./types/integer',
'./types/decimal',
'./types/date',
'./types/boolean',
'./types/composite',
'./types/number',
'./types/randexp',
'./types/array',
'./types/autoincrement'],
fn);