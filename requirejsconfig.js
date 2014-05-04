requirejs.config({
  paths: {
    can      : 'bower_components/canjs/amd/can',
    jquery   : 'bower_components/jquery/dist/jquery',
    mustache : 'bower_components/require-can-renderers/lib/mustache',
    ejs      : 'bower_components/require-can-renderers/lib/ejs',
    faker    : 'bower_components/Faker.js/Faker',
    lodash   : 'bower_components/lodash/dist/lodash',
    tv4      : 'bower_components/tv4/tv4',
    randexp  : 'bower_components/randexp/index.js'
  },
  shim : {
    faker : {
      exports : 'Faker'
    }
  }
});