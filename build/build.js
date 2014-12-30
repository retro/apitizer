{
	baseUrl : '../',
	name : 'bower_components/almond/almond.js',
	include : ['apitizer'],
	out : '../dist/apitizer.js',
	wrap : {
		startFile : './start.frag',
		endFile: './end.frag'
	},
	optimize : 'none',
	exclude : ['jquery'],
	onBuildWrite : function(moduleName, path, contents){
		return "\r\n" + contents + "\r\n";
	},
	paths: {
		jquery             : 'bower_components/jquery/dist/jquery',
		mustache           : 'bower_components/require-can-renderers/lib/mustache',
		ejs                : 'bower_components/require-can-renderers/lib/ejs',
		faker              : 'bower_components/Faker.js/Faker',
		tv4                : 'bower_components/tv4/tv4',
		RandExp            : 'bower_components/Randexp.js/index',
		taffy              : 'bower_components/taffydb/taffy',
		fakexmlhttprequest : 'bower_components/fake-xml-http-request/fake_xml_http_request',
		rlite              : 'bower_components/rlite/rlite',
		querystring        : 'bower_components/query-string/query-string'
	},
	shim : {
		faker : {
			exports : 'Faker'
		},
		taffy : {
			exports : 'TAFFY'
		},
		fakexmlhttprequest : {
			exports: 'FakeXMLHttpRequest'
		},
		rlite : {
			exports : 'Rlite',
		}
	},
	wrapShim : true,
	packages : [{
		name : 'lodash',
		location : 'bower_components/lodash-amd/modern'
	}]
}