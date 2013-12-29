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
        // Extra test dependencies
        "mock": "tests/mock",
        "utils": "tests/utils",
        "jasmine": "components/jasmine/lib/jasmine-core/jasmine",
        "jasmine-html": "components/jasmine/lib/jasmine-core/jasmine-html",
        "jasmine-console-reporter": "node_modules/jasmine-reporters/src/jasmine.console_reporter",
        "jasmine-junit-reporter": "node_modules/jasmine-reporters/src/jasmine.junit_reporter"
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
        'underscore':   { exports: '_' },
        // Extra test dependencies
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'jasmine'
        },
        'jasmine-console-reporter': {
            deps: ['jasmine-html'],
            exports: 'jasmine'
        },
        'jasmine-junit-reporter': {
            deps: ['jasmine-html'],
            exports: 'jasmine'
        }
    }
});

require([
    "spec/tracker"
    ], function() {
        // Jasmine stuff
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 250;
        var htmlReporter = new jasmine.HtmlReporter();
        jasmineEnv.addReporter(htmlReporter);
        jasmineEnv.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
        };
        jasmineEnv.execute();
    }
);
