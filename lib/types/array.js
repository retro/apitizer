define(['./_helpers', './integer', 'lodash'], function(h, integer, _){
	return h.type({
		maxItems : 10,
		minItems : 0,
		uniqueItems : false,
		typeDef : { generate : function(){ return {} }}
	},function(opts){

		var _contains = function(items, val){
			return _.filter(items, function(item){
				return _.isEqual(item, val);
			}).length > 0;
		}

		return {
			generate : function(){
				var numberOfItems = integer({minimum: opts.minItems, maximum: opts.maxItems}).generate(),
					items = [],
					val, contains;

				while(items.length < numberOfItems){
					val = opts.typeDef.generate();
					contains = opts.uniqueItems ? _contains(items, val) : false;

					if(!contains){
						items.push(val);
					}
				}

				return items;
			},
			validate : function(items){
				var check = items.length >= opts.minItems && items.length <= opts.maxItems,
					val, contains;

				if(check){
					while(items.length){

						val = items.shift();
						contains = _contains(items, val);

						if(contains){
							return false;
						}
					}
				}

				return check;
			}
		}
	})
})