require(["jquery", 
        "lib/jquery.placeholder", 
        "lib/modernizr",
        "lib/bootstrap/js/bootstrap-tooltip",
        "lib/bootstrap/js/bootstrap-popover",
        "lib/bootstrap/js/bootstrap-dropdown",
        "lib/bootstrap/js/bootstrap-alert",
        "lib/bootstrap-datepicker",
        "lib/select2-3.3.1/select2",
        "lib/jquery-validation/jquery.validate",
        "spec/MainSpec"
    ], function() {
        window.localStorage.clear();
        // Jasmine stuff
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 250;
        var htmlReporter = new jasmine.HtmlReporter();
        jasmineEnv.addReporter(htmlReporter);
        jasmineEnv.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
        };
        jasmineEnv.execute();
});
