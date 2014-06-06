define(['../_helpers', '../integer'], function(h, integer){

	var re = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;

	return h.type({
		minimum : (function(){ var d = new Date; d.setTime(0); return d})(),
		maximum : new Date
	}, function(opts){
		return {
			generate : function(){
				var date = new Date;

				date.setTime(integer({
					minimum : opts.minimum.getTime(),
					maximum : opts.maximum.getTime(),
				}).generate());

				return date.toISOString();
			},
			validate : function(val){
				return typeof val === "string" && re.test(val);
			}
		}
	})
})
