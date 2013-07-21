(function (root, factory) {
    define([
        "klokwerk"
        ], function (klokwerk, mock_connection) {
            return factory(klokwerk, mock_connection);
        }
    );
} (this, function (klokwerk, mock_connection) {
    return describe("klokwerk.js", $.proxy(function() {
        it("is not shown by default", $.proxy(function () {
        }, klokwerk));
    }, klokwerk));
}));
