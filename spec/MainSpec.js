(function (root, factory) {
    define([
        "klokwerk"
        ], function (klokwerk, mock_connection) {
            return factory(klokwerk, mock_connection);
        }
    );
} (this, function (klokwerk, mock_connection) {

    createTask = function (desc, tags) {
        var $form = klokwerk.trackerview.$el.find('form.tracker-form');
        $form.find('input#task-name').val(desc);
        $form.find('input#labels').val(tags.join(','));
        $form.submit();
    };

    return describe("The Tracker", $.proxy(function () {

        beforeEach (function () {
            window.localStorage.clear();
            $('#current-tasks-section').hide().find('ul.tasklist').empty();
            $('#finished-tasks-section').hide().find('ul.tasklist').empty();
        });

        describe('The current tasks section', $.proxy(function () {
            it("shows nothing if there aren't any tasks", $.proxy(function () {
                expect($('#current-tasks-section').is(':visible')).toEqual(false);
            }, klokwerk));
        
            it('allows the creation of a new task', $.proxy(function () {
                createTask('Writing a book', ['writing', 'book']);
                var $section = $('#current-tasks-section');
                expect($section.is(':visible')).toEqual(true);
                expect($section.find('ul.tasklist').children('li').length).toEqual(1);
                var $task = $section.find('li');
                expect($task.find('span.label').length).toEqual(2);
                expect($task.find('span.label:first').text()).toEqual('writing');
                expect($task.find('span.label:last').text()).toEqual('book');
            }, klokwerk));
        }));

        describe('The current task', $.proxy(function () {
            it('is automatically stopped when a new task is created', $.proxy(function () {
                var $section = $('#current-tasks-section');
                expect($section.is(':visible')).toEqual(false);
                runs(function () {
                    createTask('Writing a book', ['writing', 'book']);
                });
                waits(250);
                runs(function () {
                    expect($section.is(':visible')).toEqual(true);
                    createTask('Editing a play', ['editing', 'play']);
                });
                waits(250);
                runs(function () {
                    expect($section.is(':visible')).toEqual(true);
                });
            }));
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
