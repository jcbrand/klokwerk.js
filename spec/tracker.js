(function (root, factory) {
    define(["utils"],
        function (utils) {
            return factory(utils.klokwerk, utils.mock, utils);
        }
    );
} (this, function (klokwerk, mock, utils) {
    describe("The Tracker", $.proxy(function () {
        beforeEach(function () {
            if (klokwerk.trackerview) {
                var i, keys = _.keys(klokwerk.trackerview.taskviews);
                for (i=0; i<keys.length; i++) {
                    klokwerk.trackerview.taskviews[keys[i]].remove();
                    delete klokwerk.trackerview.taskviews[keys[i]];
                }
                klokwerk.trackerview.undelegateEvents();
            }
            utils.removeCurrentTasks().removeFinishedTasks();
            klokwerk.initialize();
        });

        afterEach(function () {
            window.localStorage.clear();
        });

        describe('The task form', $.proxy(function () {
            it('allows the creation of a new task', $.proxy(function () {
                utils.createTaskFromForm('Writing a book', ['writing', 'book']);
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
                    utils.createTaskFromForm('Proofreading my  book', ['book']);
                });
                waits(500);
                runs(function () {
                    expect($section.is(':visible')).toEqual(true);
                    expect($section.find('ul.tasklist').children('li').length).toEqual(1);
                    utils.createTaskFromForm('Editing a play', ['editing', 'play']);
                });
                waits(500);
                runs(function () {
                    var $finished_section = $('#finished-tasks-section');
                    expect($finished_section.is(':visible')).toEqual(true);
                    var $day_section = $finished_section.find('span.day-section');
                    expect($day_section.length).toEqual(1);
                    expect($day_section.find('ul.tasklist').children('li').length).toEqual(1);
                    // Check that the tags widget is empty
                    var $form = klokwerk.trackerview.$el.find('form.tracker-form');
                    var $tags = $form.find('ul.select2-choices li.select2-search-choice');
                    expect($tags.length).toEqual(0);
                });
            }));
        }));

        describe('The finished tasks section', $.proxy(function () {
            it("shows nothing if there aren't any tasks", $.proxy(function () {
                expect($('#finished-tasks-section').is(':visible')).toEqual(false);
            }, klokwerk));

            it('shows finished tasks if they exist', $.proxy(function () {
                runs(function () {
                    var d, end, i, start;
                    for (i=1; i<5; i++) {
                        d = new Date();
                        start = new Date(d.setDate(d.getDate()-i));
                        end = new Date(start.getTime() + 60*1000);
                        utils.createTask('Task '+i, start, end);
                    }
                });
                waits(500);
                runs(function () {
                    var i;
                    var $finished_section = $('#finished-tasks-section');
                    expect($finished_section.is(':visible')).toEqual(true);
                    // Check that day sections are in reverse chronological
                    // order
                    var $day_section = $finished_section.find('span.day-section');
                    var dates = [];
                    for (i=0; i<$day_section.length; i++) {
                        dates.push($($day_section[i]).data().day);
                    }
                    expect(dates).toEqual(dates.sort().reverse());
                    // There must be one day section per task created (since
                    // each is on a different day).
                    expect($day_section.length).toEqual(4);
                    $day_section.each(function (i, day_section) {
                        expect($(day_section).find('ul.tasklist').children('li').length).toEqual(1);
                    });
                });
            }, klokwerk));
        }));

    }, klokwerk));
}));
