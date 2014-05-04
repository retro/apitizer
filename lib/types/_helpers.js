define(['lodash'], function(_){
	var helpers = {
		defaults : function(def){
			return function(passed){
				passed = passed || {};
				return _.extend(def, passed);
			}
		},
		withDefaults : function(defaults, fn){
			return function(passed){
				return fn(helpers.defaults(defaults)(passed));
			}
		}
	}

	return helpers;
});