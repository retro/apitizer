define(['./_helpers', './composite', './integer', './decimal'], function(h, composite, integer, decimal){
	return h.type({
		minimum: 0,
		maximum: 1,
		multipleOf : null,
		exclusiveMaximum : false,
		exclusiveMinimum : false
	}, function(opts){
		return composite({
			anyOf: [integer(opts), decimal(opts)]
		});
	})
})