(function (root, factory) {
    define(["utils"],
        function (utils) {
            return factory(utils.klokwerk, utils.mock, utils);
        }
    );
} (this, function (klokwerk, mock, utils) {
    describe("The Tracker", $.proxy(function () {
        describe("The task form", $.proxy(function () {
            beforeEach(function () {
                utils.clearTracker();
                klokwerk.initialize();
            });
            afterEach(function () {
                utils.clearTracker();
            });

            it("allows the creation of a new task", $.proxy(function () {
                var trackerview = klokwerk.trackerview;
                spyOn(trackerview, "startTaskFromForm").andCallThrough();
                trackerview.delegateEvents(); // We need to rebind all events otherwise our spy won't be called
                utils.createTaskFromForm("Writing a book", ["writing", "book"]);
                expect(trackerview.startTaskFromForm).toHaveBeenCalled();
                var $section = $('#current-tasks-section');
                expect($section.is(':visible')).toEqual(true);
                expect($section.find('ul.tasklist').children("li").length).toEqual(1);
                var $task = $section.find("li");
                expect($task.find('span.label').length).toEqual(2);
                expect($task.find('span.label:first').text()).toEqual("writing");
                expect($task.find('span.label:last').text()).toEqual("book");
            }, klokwerk));
        }));

        describe("The current task", $.proxy(function () {
            beforeEach(function () {
                utils.clearTracker();
                klokwerk.initialize();
            });
            afterEach(function () {
                utils.clearTracker();
            });

            it('is shown under a special "Current Task" section', $.proxy(function () {
                var $section = $('#current-tasks-section');
                expect($section.is(':visible')).toEqual(false);
                utils.createTaskFromForm("Writing Jasmine Tests", []);
                expect($section.is(':visible')).toEqual(true);
            }), klokwerk);

            it("is automatically stopped when a new task is created", $.proxy(function () {
                var trackerview = klokwerk.trackerview;
                spyOn(trackerview, "startTaskFromForm").andCallThrough();
                spyOn(trackerview, "stopCurrentTask").andCallThrough();
                spyOn(trackerview, "addTask").andCallThrough();
                trackerview.delegateEvents(); // We need to rebind all events otherwise our spy won't be called

                var $section = $('#current-tasks-section');
                expect($section.is(':visible')).toEqual(false);
                runs(function () {
                    utils.createTaskFromForm("Proofreading my  book", ["book"]);
                });
                waits(250);
                runs(function () {
                    expect(trackerview.startTaskFromForm).toHaveBeenCalled();
                    expect($section.is(':visible')).toEqual(true);
                    expect($section.find('ul.tasklist').children("li").length).toEqual(1);
                    utils.createTaskFromForm("Editing a play", ["editing", "play"]);
                });
                waits(250);
                runs(function () {
                    expect(trackerview.startTaskFromForm).toHaveBeenCalled();
                    expect(trackerview.stopCurrentTask).toHaveBeenCalled();
                    expect(trackerview.addTask).toHaveBeenCalled();

                    var $finished_section = $('#finished-tasks-section');
                    expect($finished_section.is(':visible')).toEqual(true);
                    var $day_section = $finished_section.find('span.day-section');
                    expect($day_section.length).toEqual(1);
                    expect($day_section.find('ul.tasklist').children("li").length).toEqual(1);
                    // Check that the tags widget is empty
                    var $form = klokwerk.trackerview.$el.find('form.tracker-form');
                    var $tags = $form.find('ul.select2-choices li.select2-search-choice');
                    expect($tags.length).toEqual(0);
                });
            }), klokwerk);
        }));

        describe("The finished tasks section", function () {
            beforeEach(function () {
                utils.clearTracker();
                klokwerk.initialize();
            });
            afterEach(function () {
                utils.clearTracker();
            });

            it("gets updated as current tasks are stopped", $.proxy(function () {
                /* Check that as new tasks are created, the finished tasks
                 * listing grows with the names of the automatically stopped
                 * previous tasks.
                 */
                var task1 = "Writing unit tests";
                var task2 = "Editing a play";
                var $finished_section = $('#finished-tasks-section');
                expect($finished_section.is(':visible')).toEqual(false);
                utils.createTaskFromForm(task1, []);
                expect($finished_section.is(':visible')).toEqual(false);
                utils.createTaskFromForm(task2, []);
                expect($finished_section.is(':visible')).toEqual(true);

                var $day_section = $finished_section.find('span.day-section');
                expect($day_section.find('ul.tasklist').children("li").length).toEqual(1);
                expect($day_section.find('ul.tasklist').find("a.task-name").first().text()).toEqual(task1);
                utils.createTaskFromForm("Walking the dog", ["dog", "excercise"]);
                expect($day_section.find('ul.tasklist').children("li").length).toEqual(2);
                expect($day_section.find('ul.tasklist').find("a.task-name").last().text()).toEqual(task2);
            }, klokwerk));

            it("shows finished tasks if they exist", $.proxy(function () {
                runs(function () {
                    var d, end, i, start;
                    for (i=1; i<5; i++) {
                        d = new Date();
                        start = new Date(d.setDate(d.getDate()-i));
                        end = new Date(start.getTime() + 60*1000);
                        utils.createTask("Task "+i, start, end);
                    }
                });
                waits(250);
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
                        expect($(day_section).find('ul.tasklist').children("li").length).toEqual(1);
                    });
                });
            }, klokwerk));

            describe("The Day View", $.proxy(function () {
                beforeEach(function () {
                    utils.clearTracker();
                    klokwerk.initialize();
                });
                afterEach(function () {
                    utils.clearTracker();
                });

                it("shows the date that day", $.proxy(function () {
                    var $finished_section = $('#finished-tasks-section');
                    expect($finished_section.is(':visible')).toEqual(false);
                    expect($finished_section.find('span.day-section').length).toEqual(0);
                    // Create a task one day ago.
                    var end = moment().subtract("days", 1);
                    var start = end.clone().subtract("hours", 1).subtract("minutes", 11);
                    // Check that there is now a "Finished Tasks" section, with
                    // a day.
                    utils.createTask("Task", start.format(), end.format());
                    expect($finished_section.is(':visible')).toEqual(true);
                    var day = $finished_section.find('span.day-section');
                    var day_heading = day.find('time.day-heading');
                    expect(day.length).toEqual(1);
                    expect(day.data("day")).toEqual(moment(start).startOf("day").format());
                    expect(day_heading.attr("datetime")).toEqual(moment(start).startOf("day").format());
                    expect(day_heading.text()).toEqual(moment(start).startOf("day").format("dddd, MMM Do YYYY"));
                }), klokwerk);

                it("shows the amount of time spent on tasks for that day", $.proxy(function () {
                    var $finished_section = $('#finished-tasks-section');
                    // Create a task one day ago.
                    var end = moment().subtract("days", 1);
                    var start = end.clone().subtract("hours", 1).subtract("minutes", 11);
                    // Check that there is now a "Finished Tasks" section, with
                    // a day.
                    utils.createTask("Task", start.format(), end.format());
                    var day = $finished_section.find('span.day-section');
                    var hours_spent = day.find('.day-heading time.spent .hours').text();
                    var minutes_spent = day.find('.day-heading time.spent .minutes').text();
                    expect(hours_spent).toEqual("1");
                    expect(minutes_spent).toEqual("11");
                }), klokwerk);

                it("shows tasks that started on that day, even if they end on a later day", $.proxy(function () {
                    var $finished_section = $('#finished-tasks-section');
                    // Create a task that spans two days
                    var end = moment();
                    var start = end.clone().subtract("days", 1);
                    // Check that there is now a "Finished Tasks" section, with
                    // a day.
                    utils.createTask("Task", start.format(), end.format());
                    var day = $finished_section.find('span.day-section');
                    var hours_spent = day.find('.day-heading time.spent .hours').text();
                    var minutes_spent = day.find('.day-heading time.spent .minutes').text();
                    expect(hours_spent).toEqual("24");
                    expect(minutes_spent).toEqual("0");
                    expect(day.find('time.day-heading').attr('datetime')).toEqual(start.startOf('day').format());
                }), klokwerk);
            }, klokwerk));

            describe("The Month View", $.proxy(function () {
                // TODO
            }, klokwerk));

            describe("The Year View", $.proxy(function () {
                // TODO
            }, klokwerk));
        });

    }, klokwerk));
}));
