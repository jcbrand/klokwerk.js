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
        "klokwerk"
    ], function($) {
        var klokwerk = arguments[10];
        $(document).ready(function () {
            klokwerk.initialize();
        });
    }
);
