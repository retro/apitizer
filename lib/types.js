var TYPES = ['string', 'integer', 'decimal', 'date', 'boolean', 'composite', 'number', 'randexp'],
	files = ['lodash'],
	fn = function(lodash){
		var startAt = fn.length,
			args = _.toArray(arguments).slice(startAt, arguments.length);
			types = {};

		_.each(TYPES, function(type, i){
			types[type] = args[i];
		})

		window.types = types;

		return types;
	}

for(var i = 0; i < TYPES.length; i++){
	files.push('./types/' + TYPES[i]);
}

define(files, fn);