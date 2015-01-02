define(['apitizer', 'jquery'], function(apitizer, $) {
	return function() {
		
		module('apitizer/non_existing_url', {
			setup: function(){
				apitizer.start();
			},
			teardown : function(){
				apitizer.stop();
			}
		});

		asyncTest("Non existing url", function(){
			$.get('/some_non_existing_url', {}).fail(function(error){
				equal(error.status, 404, "Correct status is returned from the non existing url");
				start();
			});
			
		})

	};
});