/*!
 * klokwerk.js
 * http://opkode.com
 *
 * Copyright (c) JC Brand (jc@opkode.com)
 */

// AMD/global registrations
(function (root, factory) {
    define('klokwerk', [
        "klokwerk-dependencies", "klokwerk-templates"
        ], function (deps, templates) {
            return factory(jQuery, _, templates);
        }
    );
}(this, function ($, _, templates) {
    "use strict";
    if (typeof console === "undefined" || typeof console.log === "undefined") {
        console = { log: function () {}, error: function () {} }; // jshint ignore:line
    }
    var klokwerk = {
        templates: templates
    };

    klokwerk.Task = Backbone.Model.extend({
        initialize: function (attributes) {
            this.on('change:end', this.setDuration, this);
            if (attributes.end) {
                this.setDuration();
            }
        },

        setDuration: function () {
            var duration = this.getDuration();
            this.set({
                'duration': duration.asMilliseconds(),
                'hours': Math.floor(duration.asHours()),
                'minutes': Math.floor(duration.minutes())
            });
        },

        getDuration: function (end) {
            /* "end" must be a moment instance.
             *
             * Returns moment.duration object
             */
            if (!end) {
                end = moment(this.get('end'));
            }
            return moment.duration(end - moment(this.get('start')));
        },

        stop: function () {
            var end_date = moment();
            var end_iso = end_date.format();
            this.set({
                'end': end_iso,
                'end_day': end_date.startOf('day').format(),
                'end_month': end_date.startOf('month').format(),
                'duration': 0
            });
            this.save();
        },

        isCurrent: function () {
            return this.get('end') === undefined;
        }
    });

    klokwerk.TaskView = Backbone.View.extend({
        tagName: 'li',
        className: 'clearfix',
        events: {
            "click a.remove-task": "removeTask"
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            var i, prefix, duration,
                d = this.model.toJSON(),
                start = moment(this.model.get('start')),
                end = moment(this.model.get('end')),
                minutes = start.minute().toString();
            d.start_time = start.hour()+':'+(minutes.length === 1 ? '0'+minutes: minutes);
            d.start_iso = start.format();
            d.end = end;
            if (end !== undefined) {
                end = moment(end);
                prefix = 'finished';
            } else {
                end = moment();
                prefix = 'current';
            }
            duration = moment.duration(this.model.getDuration(end));
            d.minutes = duration.minutes();
            d.hours = Math.floor(duration.asHours());

            minutes = end.minute().toString();
            d.end_time = end.hour()+':'+(minutes.length === 1 ? '0'+minutes: minutes);
            d.end_iso = moment(end).format();
            this.$el.html(klokwerk.templates.task(d));
            if (prefix === 'finished') {
                this.$el.removeClass('current-task');
            } else {
                this.$el.addClass('current-task');
            }
            this.$el.addClass(prefix+'-task');
            for (i=0; i<d.labels.length; i++) {
                this.$el.find('a.edit-task').before(klokwerk.templates.label({label: d.labels[i]}));
            }
            if (this.model.isCurrent()) {
                setTimeout($.proxy(function () {
                    this.render();
                }, this), 60000);
            }
            return this;
        },

        isCurrent: function () {
            return this.model.isCurrent();
        },

        removeTask: function (ev) {
            ev.preventDefault();
            var $el, result = confirm("Are you sure you want to remove this task?");
            if (result === true) {
                $el = $(ev.target);
                $el.closest('li').hide($.proxy(function () {
                    this.model.destroy();
                    this.$el.remove();
                    if (this.$el.closest('ul.tasklist').length === 0) {
                        if (this.isCurrent()) {
                            // remove the "Current Task" section
                            if (klokwerk.trackerview.$current_section.is(':visible')) {
                                klokwerk.trackerview.$current_section.slideUp();
                            }
                        }
                    }
                }, this));
            }
            return this;
        }
    });

    klokwerk.CurrentTasksView = Backbone.Overview.extend({
        el: "div#current-tasks-section",

        initialize: function () {
            this.model.on('add', function (task) {
                if (task.isCurrent()) {
                    this.renderCurrentTask(this.add(task.cid, new klokwerk.TaskView({'model': task})));
                }
            }, this);
            this.model.on('remove', function (task) {
                this.remove(task.cid);
                this.hideIfNecessary();
            }, this);
            this.model.on('change:end', function (task) {
                if (!task.isCurrent()) {
                    this.remove(task.cid);
                    this.hideIfNecessary();
                }
            }, this);
            this.initialRender();
        },

        initialRender: function () {
            this.$el.hide().html(klokwerk.templates.current_tasks());
        },

        hideIfNecessary: function () {
            // Hide if no current tasks
            if (!this.getAll().length) { this.$el.hide(); }
        },

        renderCurrentTask: function (view) {
            this.$el.find('.current-task').empty().append(view.$el);
            // Show the current tasks section if it's hidden.
            if (!this.$el.is(':visible')) {
                this.$el.slideDown();
            }
        }
    });

    klokwerk.QueryControls = Backbone.Model;

    klokwerk.QueryControlsView = Backbone.View.extend({
        tagName: "legend",

        render: function () {
            this.$el.html(klokwerk.templates.querycontrols());
            return this;
        }
    });

    klokwerk.FinishedTasksView = Backbone.Overview.extend({
        el: "div#finished-tasks-section",

        initialize: function () {
            this.model.on('add', function (task) {
                if (!task.isCurrent()) {
                    this.renderFinishedTask(this.add(task.cid, new klokwerk.TaskView({'model': task})));
                }
            }, this);
            this.model.on('remove', function (task) { this.remove(task.cid); });
            this.model.on('change:end', function (task) {
                if (task.isCurrent()) {
                    this.remove(task.cid);
                }
            });
            this.days = new klokwerk.Days();
            this.dayviews = this.getDayViews();
            this.render();
        },

        render: function () {
            this.querycontrols = new klokwerk.QueryControlsView({
                model: new klokwerk.QueryControls()
            });
            this.$el.html(this.querycontrols.render().$el);
            this.$('.datepicker').datepicker('show');
            if (_.without(this.model.pluck('end'), undefined).length) {
                this.show();
            } else {
                this.hide();
            }
        },

        renderFinishedTask: function (view) {
            /* TODO:
             * Find the current view: Day, Month or Year.
             * Find the current instance of that view (i.e. which day, month or
             * year). It will be created if it doesn't exist yet.
             *
             * Add the task to that instance, in the correct chronological
             * position.
             */
            // This is necessary due to lazy adding of Days.
            // Day might not have existed until just now (see getDay).
            this.getDay(view.model.get('start')).add(view.model);
            this.show();
        },

        getDayViews: function () {
            var _days = {};
            return {
                get: function (id) { return _days[id]; },
                set: function (id, view) { _days[id] = view; },
                getAll: function () { return _days; }
            };
        },

        renderDay: function (day_view) {
            var newer_day, day_iso = day_view.model.get('day_iso');
            // FIXME: there must be a better way of getting all days currently
            // shown.
            var all_isos = $('span.day-section').map(function() {return $(this).attr('data-day');}).get();
            all_isos.push(day_iso);
            var index = all_isos.sort().reverse().indexOf(day_iso);
            if (index === 0) {
                // There is no newer day
                this.$el.find('legend').after(day_view.$el);
            } else {
                newer_day = this.dayviews.get(this.days.get(all_isos[index-1]).cid);
                newer_day.$el.after(day_view.$el);
            }
        },

        createDay: function (day_iso) {
            var view = new klokwerk.DayView({
                model:  new klokwerk.Day({
                    'day_human': moment(day_iso).format("dddd, MMM Do YYYY"),
                    'day_iso': day_iso,
                    'id': day_iso,
                    'duration': 0
                })
            });
            this.days.add(view.model);
            this.dayviews.set(view.model.cid, view);
            this.renderDay(view);
            return view.model;
        },

        getDay: function (day_iso) {
            day_iso = moment(day_iso).startOf('day').format();
            var day = this.days.get(day_iso);
            if (!day) {
                day = this.createDay(day_iso);
            }
            return day;
        },

        show: function () {
            if (!this.$el.is(':visible')) {
                this.$el.slideDown();
            }
        },

        hide: function () {
            this.$el.hide();
        }
    });

    klokwerk.Tracker = Backbone.Collection.extend({
        /* A collection of all tasks in the time tracker.
         */
        model: klokwerk.Task,

        current: function () {
            return this.where({end: undefined});
        }
    });

    klokwerk.TrackerView = Backbone.View.extend({
        el: "div#tracker",
        events: {
            "submit form.tracker-form": "taskFormSubmitted",
            "submit form.current-task-form": "stopTask",
            "click a.task-name": "taskLinkClicked",
            "click a.edit-task": "editTask"
        },

        initialize: function () {
            this.finished_tasks = new klokwerk.FinishedTasksView({'model': this.model});
            this.current_tasks = new klokwerk.CurrentTasksView({'model': this.model});
        },

        stopCurrentTask: function () {
            _.each(this.model.current(), function (el) {
                el.stop();
            });
            return this;
        },

        addTaskFromForm: function () {
            this.stopCurrentTask();
            var $form = this.$el.find('form.tracker-form'),
                $taskname = $form.find('#task-name'),
                $labels = $form.find('#labels'),
                arr = $taskname.val().split('@'),
                m = moment();
            $taskname.val('');
            this.model.create({
                'id': m.valueOf(),
                'description': arr[0],
                'start': m.format(),
                'start_day': m.clone().startOf('day').format(),
                'start_month': m.clone().startOf('month').format(),
                'end': undefined,
                'category': arr[1] || '',
                'labels': ($labels.val() || '').split(',')
                });
            return this.clearForm();
        },

        clearForm: function () {
            var $form = this.$el.find('form.tracker-form');
            $form.find('input#task-name').attr('value', '').val();
            $form.find('input#organisation').val();
            $("#labels").select2('val', '');
            return this;
        },

        taskFormSubmitted: function (ev) {
            ev.preventDefault();
            var $form;
            if (Modernizr.input.required) { // already validated via HTML5
                this.addTaskFromForm();
            } else {
                $form = this.$el.find('form.tracker-form');
                $form.validate({
                    highlight: function () {
                        $form.find('#task-name').addClass('error').wrap('<span class="control-group error"/>');
                    },
                    submitHandler: $.proxy(function () {
                        this.addTaskFromForm();
                    }, this)
                });
            }
        },

        addTaskFromLink: function ($link) {
             this.stopCurrentTask();
             var i, labels = [],
                 $labels = $link.parent().find('.label'),
                 m = moment();
             for (i=0; i < $labels.length; i++) {
                 labels.push($labels[i].innerText);
             }
             this.model.create({
                'id': m.valueOf(),
                'description': $link.text(),
                'start': m.format(),
                'start_day': m.clone().startOf('day').format(),
                'start_month': m.clone().startOf('month').format(),
                'end': undefined,
                'category': $link.parent().find('.category').text(),
                'labels': labels
            });
        },

        taskLinkClicked: function (ev) {
             ev.preventDefault();
             this.addTaskFromLink($(ev.target));
        },

        stopTask: function (ev) {
            ev.preventDefault();
            this.stopCurrentTask();
        },

        editTask: function (ev) {
            ev.preventDefault();
            alert('editTask');
        },

        getTaskView: function (task) {
            if (task.isCurrent()) {
                return this.current_tasks.get(task.cid)
            } else{
                return this.finished_tasks.get(task.cid)
            }
        }
    });

    klokwerk.DayTasks = Backbone.Collection.extend({
        /* A collection of tasks that belong to a specific day.
         *
         * The Task models belong primarily to the klokwerk.Tracker collection, and
         * secondarily here.
         *
         * Primarily meaning that the model's collection property points to
         * klokwerk.Tracker and not klokwerk.DayTasks.
         *
         * The "collection" property is used so "that a model knows where to
         * send it's .save() and .fetch() calls".
         *
         * See: https://github.com/jashkenas/backbone/issues/604
         */
        model: klokwerk.Task
    });

    klokwerk.Day = Backbone.Model.extend({
        initialize: function (attributes) {
            this.set(attributes);
            this.tasks = new klokwerk.DayTasks();
            klokwerk.tracker.on('change:end', function (task) {
                if (this.taskBelongsHere(task)) {
                    this.tasks.add(task);
                } else if (this.tasks.get(task)) {
                    // Task's end date must have change and now doesn't belong
                    // in this day anymore.
                    this.tasks.remove(task);
                }
            }, this);
        },

        add: function (task) {
            if (this.taskBelongsHere(task) && !this.tasks.get(task)) {
                this.tasks.add(task);
            }
        },

        setDuration: function () {
            var duration = this.getDuration();
            this.set({
                'duration': duration.asMilliseconds(),
                'hours': Math.floor(duration.asHours()),
                'minutes': Math.floor(duration.minutes())
            });
        },

        getDuration: function () {
            /* Returns moment.duration object */
            var msecs = 0;
            this.tasks.each(function (task) {
                msecs += moment.duration(task.get('duration')).asMilliseconds();
            });
            return moment.duration(msecs);
        },

        taskBelongsHere: function (task) {
            return moment(task.get('start')).isSame(this.get('day_iso'), 'day');
        }
    });

    klokwerk.DayView = Backbone.View.extend({
        initialize: function () {
            this.model.tasks.on('add', function (task) {
                var task_view = klokwerk.trackerview.getTaskView(task);
                task_view.render().$el.appendTo(this.$el.find('ul.tasklist'));
                task_view.delegateEvents();
                this.model.setDuration();
                this.render();
            }, this);
            this.model.tasks.on('change:duration', function (task) {
                this.model.setDuration();
                this.render();
            }, this);
        },

        render: function (init) {
            /* Updates the duration of time spent on tasks in this day
             */
            var duration = moment.duration(this.model.get('duration'));
            this.$('.day-heading').html($(klokwerk.templates.day_heading(this.model.toJSON())));
            return this;
        },

        _ensureElement: function() {
            /* Override method from backbone.js
             * Make sure that the el and $el attributes point to a DOM snippet
             * from src/templates/day.html
             */
            if (!this.el) {
                var $el = $(klokwerk.templates.day(this.model.toJSON()));
                this.setElement($el, false);
            } else {
                this.setElement(_.result(this, 'el'), false);
            }
        },
    });

    klokwerk.Days = Backbone.Collection.extend({
        model: klokwerk.Day,
        comparator: 'day_iso'
    });

    klokwerk.initialize = function () {
        $('.help_button').popover();
        $("#labels").select2({
            placeholder: "Labels",
            height: '20px',
            tags:["red", "green", "blue"],
            tokenSeparators: [";"]
        });
        this.tracker = new this.Tracker();
        this.tracker.browserStorage = new Backbone.BrowserStorage.local('klokwerk'); // FIXME: proper id
        this.trackerview = new this.TrackerView({'model': this.tracker});
        this.tracker.fetch({add:true});
    };
    return klokwerk;
}));

