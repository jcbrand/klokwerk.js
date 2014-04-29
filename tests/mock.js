(function (root, factory) {
    define("mock",
        ['klokwerk'],
        function() {
            return factory();
        });
}(this, function () {
    var mock = {};
    return mock;
}));
