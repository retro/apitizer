requirejs.config({
  paths: {
    jquery             : 'bower_components/jquery/dist/jquery',
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
  packages : [{
    name : 'lodash',
    location : 'bower_components/lodash-amd/modern'
  }]
});