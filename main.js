
require.config({
    paths: {
        "jquery": "components/jquery/jquery",
        "jquery.placeholder": "lib/jquery.placeholder", 
        "modernizr": "lib/modernizr",
        "bootstrap-tooltip": "lib/bootstrap/js/bootstrap-tooltip",
        "bootstrap-popover": "lib/bootstrap/js/bootstrap-popover",
        "bootstrap-dropdown": "lib/bootstrap/js/bootstrap-dropdown",
        "bootstrap-alert": "lib/bootstrap/js/bootstrap-alert",
        "bootstrap-datepicker": "lib/bootstrap-datepicker",
        "select2": "lib/select2-3.3.1/select2",
        "jquery.validate": "lib/jquery-validation/jquery.validate",
        "locales": "locale/locales",
        "underscore": "lib/underscore",
        "backbone": "lib/backbone",
        "backbone.localStorage": "lib/backbone.localStorage",
        "klokwerk-dependencies": "src/deps-full",
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
