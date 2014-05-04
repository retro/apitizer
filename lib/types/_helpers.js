define(['lodash'], function(_){
	var helpers = {
		defaults : function(def){
			return function(passed){
				passed = passed || {};
				return _.extend(def || {}, passed);
			}
		},
		type : function(defaults, fn){
			if(arguments.length === 1){
				fn = defaults;
				defaults = {}
			}

			return function(passed){
				var opts   = helpers.defaults(defaults)(passed),
					result = fn(opts);

				result.opts = opts;

				return result;
			}
		}
	}

	return helpers;
});