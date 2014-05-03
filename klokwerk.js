/*!
 * klokwerk.js
 * http://opkode.com
 *
 * Copyright (c) Jan-Carel Brand (jc@opkode.com)
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
            this.on('change:end', function () {
                this.set('duration', this.getDuration());
            }, this);
            if (attributes.end) {
                this.set('duration', this.getDuration());
            }
        },

        getDuration: function (end) {
            /* "end" must be a moment instance.
             *
             * Returns milliseconds since epoch
             */
            if (!end) {
                end = moment(this.get('end'));
            }
            return moment.duration(end - moment(this.get('start'))).asMilliseconds();
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
            d.hours = duration.hours();

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

    klokwerk.Tracker = Backbone.Collection.extend({
        /* A collection of all tasks in the time tracker.
         */
        model: klokwerk.Task,

        current: function () {
            return this.where({end: undefined});
        }
    });

    klokwerk.CurrentTasksView = Backbone.View.extend({
        el: "div#current-tasks-section",

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.hide();
            this.$el.html(klokwerk.templates.current_tasks());
        },

        renderCurrentTask: function (view) {
            this.$el.find('.current-task').empty().append(view.render().$el);
            // Show the current tasks section if it's hidden.
            if (!this.$el.is(':visible')) {
                this.$el.slideDown();
            }
        }
    });

    klokwerk.FinishedTasksView = Backbone.View.extend({
        el: "div#finished-tasks-section",

        initialize: function () {
            this.days = new klokwerk.Days();
            this.dayviews = this.getDayViews();
            this.render();
        },

        render: function () {
            this.$el.html(klokwerk.templates.finished_tasks());
            this.$('.datepicker').datepicker('show');
            if (this.model.length) {
                this.show();
            }
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

        renderFinishedTask: function (task_view) {
            /* TODO:
             * Find the current view: Day, Month or Year.
             * Find the current instance of that view (i.e. which day, month or
             * year). It will be created if it doesn't exist yet.
             *
             * Add the task to that instance, in the correct chronological
             * position.
             */
            // XXX: If view is Day:
            var day = this.getDay(task_view.model.get('end')),
                day_view = this.dayviews.get(day.cid);
            // This is necessary due to lazy adding of Days.
            // Day might not have existed until just now (see getDay).
            day.add(task_view.model);
            task_view.render().$el.appendTo(day_view.$el.find('ul.tasklist'));
            task_view.delegateEvents();
            this.show();
        }

    });

    klokwerk.TrackerView = Backbone.View.extend({
        el: "div#tracker",
        events: {
            "submit form.tracker-form": "startTaskFromForm",
            "submit form.current-task-form": "stopTask",
            "click a.task-name": "startTaskFromLink",
            "click a.edit-task": "editTask"
        },

        initialize: function () {
            var views = {};
            this.get = function (id) { return views[id]; };
            this.set = function (id, view) { views[id] = view; };
            this.getAll = function () { return views; };

            this.model.on('add', function (task) {
                this.set(task.cid, new klokwerk.TaskView({'model': task}));
                this.renderTask(task);
            }, this);
            this.model.on('change', this.renderTask, this);
            this.finished_tasks = new klokwerk.FinishedTasksView({'model': this.model});
            this.current_tasks = new klokwerk.CurrentTasksView({'model': this.model});
            this.model.fetch({add:true});
        },

        renderTask: function (task) {
            if (task.isCurrent()) {
                this.current_tasks.renderCurrentTask(this.get(task.cid));
            } else {
                this.current_tasks.render();
                this.finished_tasks.renderFinishedTask(this.get(task.cid));
            }
        },

        addTask: function () {
            var $form = this.$el.find('form.tracker-form'),
                $taskname = $form.find('#task-name'),
                $labels = $form.find('#labels'),
                arr = $taskname.val().split('@'),
                desc = arr[0],
                cat = arr[1] || '',
                m = moment();
            $taskname.val('');
            this.model.create({
                'id': m.millisecond(),
                'description': desc,
                'start': m.format(),
                'start_day': m.clone().startOf('day').format(),
                'start_month': m.clone().startOf('month').format(),
                'end': undefined,
                'category': cat,
                'labels': ($labels.val() || '').split(',')
                });
            return this;
        },

        stopCurrentTask: function () {
            _.each(this.model.current(), function (el) {
                el.stop();
            });
            return this;
        },

        clearForm: function () {
            var $form = this.$el.find('form.tracker-form');
            $form.find('input#task-name').attr('value', '').val();
            $form.find('input#organisation').val();
            $("#labels").select2('val', '');
            return this;
        },

        startTaskFromForm: function (ev) {
            ev.preventDefault();
            var $form;
            if (Modernizr.input.required) { // already validated via HTML5
                this.stopCurrentTask().addTask().clearForm();
            } else {
                $form = this.$el.find('form.tracker-form');
                $form.validate({
                    highlight: function () {
                        $form.find('#task-name').addClass('error').wrap('<span class="control-group error"/>');
                    },
                    submitHandler: $.proxy(function () {
                        this.stopCurrentTask().addTask().clearForm();
                    }, this)
                });
            }
        },

        startTaskFromLink: function () {
            /* XXX TODO
             * ev.preventDefault();
             * this.stopCurrentTask();
             * var i,
             *     labels = [],
             *     $link = $(ev.target),
             *     $parent = $link.parent(),
             *     $labels = $parent.find('.label'),
             *     cat = $link.parent().find('.category').text(),
             *     desc = $link.text();
             * for (i=0; i < $labels.length; i++) {
             *     labels.push($labels[i].innerText);
             * }
             * this.model.create({
             *     'description': desc,
             *     'start': moment().format(),
             *     'start_day': start_iso.split('T')[0]+'T00:00:00Z',
             *     'start_month': start_date.getUTCFullYear()+"-"+start_date.getUTCMonth()+"-1"+'T00:00:00Z',
             *     'end': undefined,
             *     'category': cat,
             *     'labels': labels
             *     });
             */
        },

        stopTask: function (ev) {
            ev.preventDefault();
            this.stopCurrentTask();
        },

        editTask: function (ev) {
            ev.preventDefault();
            alert('editTask');
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
            this.tasks.on('add', this.setDuration, this);
            this.tasks.on('change:duration', this.setDuration, this);
        },

        add: function (task) {
            if (this.taskBelongsHere(task) && !this.tasks.get(task)) {
                this.tasks.add(task);
            }
        },

        setDuration: function () {
            this.set('duration', this.getDuration());
        },

        getDuration: function () {
            /* Returns milliseconds since epoch.
             */
            var msecs = 0;
            this.tasks.each(function (task) {
                msecs += moment.duration(task.get('duration')).asMilliseconds();
            });
            return msecs;
        },

        taskBelongsHere: function (task) {
            return moment(task.get('start')).isSame(this.get('day_iso'), 'day');
        }
    });

    klokwerk.DayView = Backbone.View.extend({
        initialize: function () {
            this.model.on('add', this.render, this);
            this.model.on('change:duration', this.render, this);
        },

        render: function (init) {
            /* Updates the duration of time spent on tasks in this day
             */
            var duration = moment.duration(this.model.get('duration'));
            this.$('.day-heading').html(
                $(klokwerk.templates.day_heading({
                    day_iso: this.model.get('day_iso'),
                    day_human: this.model.get('day_human'),
                    hours: duration.hours(),
                    minutes: duration.minutes()
                })
            ));
            return this;
        },

        _ensureElement: function() {
            /* Override method from backbone.js
             *
             * Make sure that the el and $el attributes point to a DOM snippet
             * from src/templates/day.html
             */
            if (!this.el) {
                var duration = moment.duration(this.model.get('duration'));
                var $el = $(klokwerk.templates.day({
                    day_iso: this.model.get('day_iso'),
                    day_human: this.model.get('day_human'),
                    hours: duration.hours(),
                    minutes: duration.minutes()
                }));
                this.setElement($el, false);
            } else {
                this.setElement(_.result(this, 'el'), false);
            }
        },

        getTaskViews: function () {
            /* Provides an object with methods for getting and setting the
             * views for all tasks that fall under this day.
             */
            var _tasks = {};
            return {
                get: function (id) { return _tasks[id]; },
                set: function (id, view) { _tasks[id] = view; },
                getAll: function () { return _tasks; }
            };
        }
    });

    klokwerk.Days = Backbone.Collection.extend({
        model: klokwerk.Day
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
        this.tracker.localStorage = new Backbone.LocalStorage('klokwerk'); // FIXME: proper id
        this.trackerview = new this.TrackerView({'model': this.tracker});
    };
    return klokwerk;
}));

