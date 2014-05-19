    if(typeof jQuery !== 'undefined'){
        define( "jquery", [], function() {
            return jQuery;
        });
    }
    return require('apitizer');
}));