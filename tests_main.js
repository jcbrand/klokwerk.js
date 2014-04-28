// Extra test dependencies
config.paths.mock = "tests/mock";
config.paths.utils = "tests/utils";
config.paths.jasmine = "components/jasmine/lib/jasmine-core/jasmine";
config.paths["jasmine-html"] = "components/jasmine/lib/jasmine-core/jasmine-html";
config.paths["console-runner"] = "node_modules/phantom-jasmine/lib/console-runner";
config.shim['jasmine-html'] = {
    deps: ['jasmine'],
    exports: 'jasmine'
};
require.config(config);

require([
    "jquery",
    "klokwerk",
    "mock",
    "jasmine-html"
    ], function($, klokwerk, mock, jasmine) {
        require(["spec/tracker"], function() {
            // Jasmine stuff
            var jasmineEnv = jasmine.getEnv();
            var reporter;
            if (/PhantomJS/.test(navigator.userAgent)) {
                reporter = new jasmine.ConsoleReporter();
                window.console_reporter = reporter;
                jasmineEnv.addReporter(reporter);
                jasmineEnv.updateInterval = 0;
            } else {
                reporter = new jasmine.HtmlReporter();
                jasmineEnv.addReporter(reporter);
                jasmineEnv.specFilter = function(spec) {
                    return reporter.specFilter(spec);
                };
                jasmineEnv.updateInterval = 0;
            }
            jasmineEnv.execute();
        });
    }
);
