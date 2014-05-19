requirejs.config({
  paths: {
    can      : 'bower_components/canjs/amd/can',
    jquery   : 'bower_components/jquery/dist/jquery',
    mustache : 'bower_components/require-can-renderers/lib/mustache',
    ejs      : 'bower_components/require-can-renderers/lib/ejs',
    faker    : 'bower_components/Faker.js/Faker',
    tv4      : 'bower_components/tv4/tv4',
    RandExp  : 'bower_components/Randexp.js/index',
    taffy    : 'bower_components/taffydb/taffy'
  },
  shim : {
    faker : {
      exports : 'Faker'
    },
    taffy : {
      exports : 'TAFFY'
    }
  },
  packages : [{
    name : 'lodash',
    location : 'bower_components/lodash-amd/modern'
  }]
});