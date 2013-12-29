(function (root, factory) {
    define("mock",
        ['klokwerk'],
        function() {
            return factory();
        });
}(this, function (klokwerk) {
    var mock = {};
    return mock;
}));
