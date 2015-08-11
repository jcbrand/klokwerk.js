config = {
    paths: {
        "backbone": "components/backbone/backbone",
        "backbone.browserStorage": "components/backbone.browserStorage/backbone.browserStorage",
        "backbone.overview": "components/backbone.overview/backbone.overview",
        "bootstrap-alert": "components/bootstrap/js/bootstrap-alert",
        "bootstrap-datepicker": "components/bootstrap-datepicker/js/bootstrap-datepicker",
        "bootstrap-dropdown": "components/bootstrap/js/bootstrap-dropdown",
        "bootstrap-popover": "components/bootstrap/js/bootstrap-popover",
        "bootstrap-tooltip": "components/bootstrap/js/bootstrap-tooltip",
        "jquery": "components/jquery/dist/jquery",
        "jquery.placeholder": "components/jquery.placeholder/jquery.placeholder",
        "jquery.validate": "components/jquery-validation/dist/jquery.validate",
        "locales": "locale/locales",
        "modernizr": "components/modernizr/modernizr",
        "moment": "components/momentjs/moment",
        "select2": "components/select2/select2",
        "text": 'components/requirejs-text/text',
        "tpl": 'components/requirejs-tpl-jcbrand/tpl',
        "underscore": "components/underscore//underscore",
        "validate": "components/validate/validate",

        // Klokwerk Templates
        "current_tasks": "src/templates/current_tasks",
        "day": "src/templates/day",
        "day_heading": "src/templates/day_heading",
        "finished_tasks": "src/templates/finished_tasks",
        "label": "src/templates/label",
        "querycontrols": "src/templates/querycontrols",
        "task": "src/templates/task",
        "task_edit": "src/templates/task_edit",
        "tasklist": "src/templates/tasklist",

        "klokwerk-dependencies": "src/deps-full",
        "klokwerk-templates": "src/templates"
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
        "bootstrap-popover":    { deps: ['jquery', 'bootstrap-tooltip'] },
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
