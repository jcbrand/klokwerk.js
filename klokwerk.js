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
        idAttribute: '_id',

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

    klokwerk.TaskEditView = Backbone.View.extend({
        tagName: 'form',
        className: 'task-form',

        events: {
            "click button[type=submit]": "save",
            "click button[type=cancel]": "cancel"
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            var vals = this.model.toJSON();
            vals.start = moment(vals.start).format('YYYY-MM-DDTHH:mm:ss');
            vals.end = moment(vals.end).format('YYYY-MM-DDTHH:mm:ss');
            vals.current = this.model.isCurrent();
            this.$el.html($(klokwerk.templates.task_edit(vals)));
        },

        save: function (ev) {
            if (ev && ev.preventDefault) { ev.preventDefault(); }
            this.model.save({
                start: moment(this.$('input[name=start]').val()).format(),
                end: !this.model.isCurrent() ? moment(this.$('input[name=end]').val()).format() : undefined,
                description: this.$('input[name=description]').val(),
                category: this.$('input[name=category]').val()
            });
            if (this.taskview && this.taskview.editing) {
              this.taskview.editing = false;
            }
            this.remove().model.trigger('render');
        },

        cancel: function (ev) {
            if (ev && ev.preventDefault) { ev.preventDefault(); }
            if (this.taskview && this.taskview.editing) {
              this.taskview.editing = false;
            }
            this.remove().model.trigger('render');
        }
    });

    klokwerk.TaskView = Backbone.View.extend({
        tagName: 'li',
        className: 'clearfix',
        events: {
            "click a.remove-task": "removeTask",
            "click a.edit-task": "editTask"
        },

        initialize: function () {
            this.model.on('render', this.render, this);
            this.render();
        },

        render: function () {
            if (this.editing === true) {
              // Don't re-render while editing.
              return;
            }
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
                setTimeout(this.render.bind(this), 60000);
            }
            return this;
        },

        isCurrent: function () {
            return this.model.isCurrent();
        },

        editTask: function (ev) {
            if (ev && ev.preventDefault) { ev.preventDefault(); }
            var editview = new klokwerk.TaskEditView({'model': this.model});
            if (this.isCurrent()) {
                // Need to keep track that we're editing because the current
                // task gets re-rendered periodically.
                this.editing = true;
                editview.taskview = this;
            }
            this.$el.html(editview.$el);
            this.$('.task-name').focus();
            
        },

        removeTask: function (ev) {
            var $el;
            if (ev && ev.preventDefault) { ev.preventDefault(); }
            if (confirm("Are you sure you want to remove this task?") === true) {
                $el = $(ev.target);
                $el.closest('li').hide(function () {
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
                }.bind(this));
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
                if (this.get(task.cid) && !task.isCurrent()) {
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
            if (!this.keys().length) { this.$el.hide(); }
        },

        renderCurrentTask: function (view) {
            this.$el.find('.current-task').empty().append(view.$el);
            // Show the current tasks section if it's hidden.
            if (!this.$el.is(':visible')) {
                this.$el.slideDown();
            }
        }
    });

    klokwerk.QueryControls = Backbone.Model.extend({
        initialize: function (attributes) {
            this.set(_.extend({
                'view': 'week' // views can be 'day', 'week' and 'month'
            }, attributes));
        }
    });

    klokwerk.QueryControlsView = Backbone.View.extend({
        tagName: "legend",

        render: function () {
            var opts = _.extend(this.model.toJSON(), {
                'day_str': moment().startOf('day').format('D MMMM YYYY'),
                'week_str': moment().startOf('week').format('D MMMM YYYY') + ' to ' + moment().endOf('week').format('D MMMM YYYY'),
                'month_str': moment().startOf('month').format('D MMMM YYYY') + ' to ' + moment().endOf('month').format('D MMMM YYYY'),
            });
            this.$el.html(klokwerk.templates.querycontrols(opts));
            return this;
        }
    });

    klokwerk.FinishedTasksView = Backbone.View.extend({
        el: "div#finished-tasks-section",

        initialize: function () {
            this.model.on('add', this.updateDaysAfterTaskAdding, this);
            this.model.on('change:end', this.updateDaysAfterTaskAdding, this);
            this.model.on('remove', this.updateDaysAfterTaskRemoval, this);
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
            this.ensureVisibility();
        },

        ensureVisibility: function () {
            /* Make sure this view or hidden if needed. */
            if (_.without(this.model.pluck('end'), undefined).length) {
                this.show();
            } else {
                this.hide();
            }
        },

        getDayViews: function () {
            var _days = {};
            return {
                get: function (id) { return _days[id]; },
                add: function (id, view) { _days[id] = view; },
                getAll: function () { return _days; }
            };
        },

        getMonthViews: function () {
            var _months = {};
            return {
                get: function (id) { return _days[id]; },
                add: function (id, view) { _days[id] = view; },
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

        createDay: function (day_moment) {
            var view = new klokwerk.DayView({
                model:  new klokwerk.Day({
                    'day_human': day_moment.format("dddd, MMM Do YYYY"),
                    'day_iso': day_moment.format(),
                    'day_moment': day_moment,
                    'id': day_moment.format(),
                    'duration': 0
                })
            });
            this.days.add(view.model);
            this.dayviews.add(view.model.cid, view);
            this.renderDay(view);
            return view.model;
        },

        updateDaysAfterTaskRemoval: function (task) {
            /* If the last remaining task in a day has been removed, then
             * remove that day as well.
             */
            this.ensureVisibility();
            var start = moment(task.get('start')).startOf('day');
            var end = moment(task.get('end')).startOf('day');

            var _removeDayIfNecessary = function (end_iso) { 
                var day = this.days.get(end_iso);
                if (day.tasks.length === 1 && day.tasks.get(task.cid)) {
                    day.destroy();
                }
            }.bind(this);
            if (end.isSame(start)) {
                _removeDayIfNecessary(end.format());
            } else {
                // FIXME: handle all days inbetween as well.
                _removeDayIfNecessary(start.format());
                _removeDayIfNecessary(end.format());
            }
        },

        updateDaysAfterTaskAdding: function (task) {
            /*  If the day corresponding to task's end date doesn't exist,
             *  create it.
             */
            if (task.isCurrent()) { return; }
            this.show();
            var start = moment(task.get('start')).startOf('day');
            var end = moment(task.get('end')).startOf('day');

            var _updateDay = function (date) {
                if (!this.days.get(date.format())) {
                  this.createDay(date).add(task);
                }
            }.bind(this);
            if (end.isSame(start)) {
                _updateDay(end);
            } else {
                // FIXME: handle all days inbetween as well.
                _updateDay(start);
                _updateDay(end);
            }
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
        url: '/api/tracker',

        current: function () {
            return this.where({end: undefined});
        }
    });

    klokwerk.TrackerView = Backbone.View.extend({
        el: "div#tracker",
        events: {
            "submit form.tracker-form": "taskFormSubmitted",
            "submit form.current-task-form": "stopTask",
            "click a.task-name": "taskLinkClicked"
        },

        initialize: function () {
            this.finished_tasks = new klokwerk.FinishedTasksView({'model': this.model});
            this.current_tasks = new klokwerk.CurrentTasksView({'model': this.model});
        },

        stopCurrentTask: function () {
            _.each(this.model.current(), function (el) {
                el.stop();
            });
            // this.model.sync("update", this.model);
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
                    submitHandler: this.addTaskFromForm.bind(this)
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

        getTaskView: function (task) {
            if (task.isCurrent()) {
                return this.current_tasks.get(task.cid);
            } else{
                return this.finished_tasks.get(task.cid);
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
        model: klokwerk.Task,
        url: '/api/daytasks'
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
            return (moment(task.get('start')).isSame(this.get('day_iso'), 'day') ||
                    moment(task.get('end')).isSame(this.get('day_iso'), 'day')) ||

                   (moment(task.get('start')).isBefore(this.get('day_iso'), 'day') &&
                    moment(task.get('end')).isAfter(this.get('day_iso'), 'day'));
        }
    });

    klokwerk.DayView = Backbone.Overview.extend({

        initialize: function () {
            this.model.on('destroy', function (task) { this.remove(); }.bind(this));
            this.model.tasks.on('add', this.addTask, this);
            this.model.tasks.on('destroy', function (task) { this.remove(task.cid); });
            this.model.tasks.on('change:duration', function (task) {
                this.model.setDuration();
                this.renderTask(task);
            }, this);
            this.model.tasks.on('change:end', function (task) {
                if (task.isCurrent()) {
                    this.remove(task.cid);
                } else {
                    if (!this.get(task.cid)) {
                        this.addTask();
                    }
                }
            });
        },

        addTask: function (task) {
            this.model.setDuration();
            this.renderTask(this.add(task.cid, new klokwerk.TaskView({'model': task})));
            this.render();
        },

        renderTask: function (task) {
            this.$('.tasklist').append(task.$el);
            return this.render();
        },

        render: function () {
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
        comparator: 'day_iso',
        url: '/api/days'
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
        this.trackerview = new this.TrackerView({'model': this.tracker});
        this.tracker.fetch({add:true});
    };
    return klokwerk;
}));

