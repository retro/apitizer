requirejs.config({
  paths: {
    jquery   : 'bower_components/jquery/dist/jquery',
    mustache : 'bower_components/require-can-renderers/lib/mustache',
    ejs      : 'bower_components/require-can-renderers/lib/ejs',
    faker    : 'bower_components/Faker.js/Faker',
    tv4      : 'bower_components/tv4/tv4',
    RandExp  : 'bower_components/Randexp.js/index',
    taffy    : 'bower_components/taffydb/taffy',
    fixture  : 'fixture/fixture'
  },
  shim : {
    faker : {
      exports : 'Faker'
    },
    taffy : {
      exports : 'TAFFY'
    },
    fixture : {
      exports : 'fixture',
      init : function(){
        if(this.can){
          throw 'Edit `fixture/fixture.js` file to remove `window.can` object'
        }
      }
    }
  },
  packages : [{
    name : 'lodash',
    location : 'bower_components/lodash-amd/modern'
  }]
});