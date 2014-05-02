config = {
    paths: {
        "backbone": "components/backbone/backbone",
        "backbone.localStorage": "components/backbone.localStorage/backbone.localStorage",
        "bootstrap-alert": "lib/bootstrap/js/bootstrap-alert",
        "bootstrap-datepicker": "lib/bootstrap-datepicker",
        "bootstrap-dropdown": "lib/bootstrap/js/bootstrap-dropdown",
        "bootstrap-popover": "lib/bootstrap/js/bootstrap-popover",
        "bootstrap-tooltip": "lib/bootstrap/js/bootstrap-tooltip",
        "jquery": "components/jquery/dist/jquery",
        "jquery.placeholder": "components/jquery.placeholder/jquery.placeholder",
        "jquery.validate": "components/jquery-validation/dist/jquery.validate",
        "klokwerk-dependencies": "src/deps-full",
        "klokwerk-templates": "src/templates",
        "locales": "locale/locales",
        "modernizr": "components/modernizr/modernizr",
        "moment": "components/momentjs/moment",
        "select2": "components/select2/select2",
        "text": 'components/requirejs-text/text',
        "tpl": 'components/requirejs-tpl-jcbrand/tpl',
        "underscore": "components/underscore//underscore"
    },

    tpl: {
        // Use Mustache style syntax for variable interpolation
        templateSettings: {
            evaluate : /\{\[([\s\S]+?)\]\}/g,
            interpolate : /\{\{([\s\S]+?)\}\}/g
        }
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
        'underscore':           { exports: '_' },
        "bootstrap-alert":      { deps: ['jquery'] },
        "bootstrap-datepicker": { deps: ['jquery'] },
        "bootstrap-dropdown":   { deps: ['jquery'] },
        "bootstrap-popover":    { deps: ['jquery'] },
        "bootstrap-tooltip":    { deps: ['jquery'] },
        "jquery.placeholder":   { deps: ['jquery'] },
        "jquery.validate":      { deps: ['jquery'] },
        "select2":              { deps: ['jquery'] }
    }
};

if (typeof(require) !== 'undefined') {
    require.config(config);
    require(["klokwerk"], function(klokwerk){
        $(document).ready(function () {
            klokwerk.initialize();
        });
    });
}
