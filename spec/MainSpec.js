(function (root, factory) {
    define([
        "klokwerk"
        ], function (klokwerk, mock_connection) {
            return factory(klokwerk, mock_connection);
        }
    );
} (this, function (klokwerk, mock_connection) {
    return describe("The Tracker", $.proxy(function () {
        
        beforeEach (function () {
            window.localStorage.clear();
            $('#current-tasks-section').hide().find('ul.tasklist:first').empty();
        });

        describe('The current tasks section', $.proxy(function () {
            it("shows nothing if there aren't any tasks", $.proxy(function () {
                expect($('#current-tasks-section').is(':visible')).toEqual(false);
            }, klokwerk));
        
            it('allows the creation of a new task', $.proxy(function () {
                var $form = klokwerk.trackerview.$el.find('form.tracker-form');
                $form.find('input#task-name').val('Writing a blog post');
                $form.submit();
                expect($('#current-tasks-section').is(':visible')).toEqual(true);
                expect($('#current-tasks-section').hide().find('ul.tasklist').children().length, 1);
            }, klokwerk));
        }));

        describe('The finished tasks section', $.proxy(function () {
            it("shows nothing if there aren't any tasks", $.proxy(function () {
                expect($('#finished-tasks-section').is(':visible')).toEqual(false);
            }, klokwerk));
        
            it('shows finished tasks if there are any', $.proxy(function () {
            }, klokwerk));
        }));

    }, klokwerk));
}));
