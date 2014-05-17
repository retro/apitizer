define(['apitizer'], function(apitizer) {
	return function() {

		var authorSchema = {
			type : 'object',
			properties : {
				id : {
					type : 'integer'
				},
				username : {
					type: 'string'
				},
				password : {
					type : 'string'
				}
			}
		}

		var articleSchema = {
			type : 'object',
			properties : {
				title : {
					type : 'string'
				},
				author : {
					$ref : 'author'
				}
			}
		}

		apitizer.addSchema('author', authorSchema);
		apitizer.addSchema('article', articleSchema);

		var authorStore = apitizer.schemaStore('author', 1, {
			id : apitizer.types.autoincrement(),
			username : 'retro',
			password : function(){
				return 'password'
			}
		});

		var articleStore = apitizer.schemaStore('article', 0, {
			author : authorStore.one()
		});

		module('apitizer/related_fixtures', {
			start : function(){
				apitizer.addSchema('author', authorSchema);
				apitizer.addSchema('article', articleSchema);
			}
		});

		test('Generating an article will use the related author store', function() {
			var article = articleStore.generate();
			
			equal(article.author.id, 1);
			equal(article.author.username, 'retro');
			equal(article.author.password, 'password');
		});

	};
});