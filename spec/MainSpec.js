(function (root, factory) {
    define([
        "klokwerk"
        ], function (klokwerk, mock_connection) {
            return factory(klokwerk, mock_connection);
        }
    );
} (this, function (klokwerk, mock_connection) {

    createTaskFromForm = function (desc, tags) {
        var $form = klokwerk.trackerview.$el.find('form.tracker-form');
        $form.find('input#task-name').val(desc);
        $form.find('input#labels').val(tags.join(','));
        $form.submit();
    };
    return describe("The Tracker", $.proxy(function () {
        afterEach(function () {
            window.localStorage.clear();
            $('#current-tasks-section').hide().find('ul.tasklist').empty();
            $('#finished-tasks-section').hide().find('ul.tasklist').empty();
        });

        describe('The task form', $.proxy(function () {
        
            it('allows the creation of a new task', $.proxy(function () {
                createTaskFromForm('Writing a book', ['writing', 'book']);
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
                    createTaskFromForm('Writing a book', ['writing', 'book']);
                });
                waits(500);
                runs(function () {
                    expect($section.is(':visible')).toEqual(true);
                    createTaskFromForm('Editing a play', ['editing', 'play']);
                });
                waits(500);
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
                runs(function () {
                    var d = new Date(), 
                            end_date, end_iso, i, start_date, start_iso;
                    for (i=1; i<5; i++) {
                        start_date = new Date(d.setDate(d.getDate()-i));
                        start_iso = klokwerk.toISOString(klokwerk.roundDate(start_date));
                        end_date = new Date(start_date.getTime() + 60*1000);
                        end_iso = klokwerk.toISOString(klokwerk.roundDate(end_date));

                        klokwerk.tracker.create({
                            'description': 'Task '+i,
                            'start': start_iso,
                            'start_day': start_iso.split('T')[0]+'T00:00:00Z',
                            'start_month': start_date.getUTCFullYear()+"-"+start_date.getUTCMonth()+"-1"+'T00:00:00Z',
                            'end': end_iso,
                            'category': '',
                            'labels': '' 
                        });
                    }
                });
                waits(500);
                runs(function () {
                    alert('hello');
                });
            }, klokwerk));
        }));

    }, klokwerk));
}));
