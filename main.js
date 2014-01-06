
require.config({
    paths: {
        "jquery": "components/jquery/jquery",
        "jquery.placeholder": "components/jquery.placeholder/jquery.placeholder", 
        "modernizr": "components/modernizr/modernizr",
        "bootstrap-tooltip": "lib/bootstrap/js/bootstrap-tooltip",
        "bootstrap-popover": "lib/bootstrap/js/bootstrap-popover",
        "bootstrap-dropdown": "lib/bootstrap/js/bootstrap-dropdown",
        "bootstrap-alert": "lib/bootstrap/js/bootstrap-alert",
        "bootstrap-datepicker": "lib/bootstrap-datepicker",
        "select2": "components/select2/select2",
        "jquery.validate": "components/jquery-validation/jquery.validate",
        "locales": "locale/locales",
        "underscore": "components/underscore//underscore",
        "backbone": "components/backbone/backbone",
        "backbone.localStorage": "components/backbone.localStorage/backbone.localStorage",
        "klokwerk-dependencies": "src/deps-full"
    },

    // define module dependencies for modules not using define
    shim: {
        'backbone': {
            //These script dependencies should be loaded before loading
            //backbone.js
            deps: [
                'underscore',
                'jquery'
                ],
            //Once loaded, use the global 'Backbone' as the
            //module value.
            exports: 'Backbone'
        },
        'underscore':   { exports: '_' }
    }
});

require(["klokwerk"],
    function(klokwerk) {
        $(document).ready(function () {
            klokwerk.initialize();
        });
    }
);
