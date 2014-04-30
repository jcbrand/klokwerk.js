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
        console = { log: function () {}, error: function () {} };
    }
    var klokwerk = {
        templates: templates
    };

    klokwerk.Task = Backbone.Model.extend({
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
            var i, prefix,
                d = this.model.toJSON(),
                start = moment(this.model.get('start')),
                end = this.model.get('end'),
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
            minutes = end.minute().toString();
            d.end_time = end.hour()+':'+(minutes.length === 1 ? '0'+minutes: minutes);
            d.end_iso = moment(end).format();
            d.minutes = (end-start)/(1000*60);
            d.hours = Math.floor(d.minutes/60);
            d.minutes = Math.round(d.minutes-(d.hours*60));
            this.model.set('duration', d.hours*60*60 + d.minutes*60);
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

        renderTask: function (view) {
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
                    'day_human': moment(day_iso).format("YYYY-MM-DD"),
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

        renderTask: function (task_view) {
            var day_iso = task_view.model.get('end').split('T')[0] + 'T00:00:00Z';
            var day = this.getDay(day_iso);
            var duration = day.get('duration');
            day.set('duration', duration + task_view.model.get('duration'));
            var day_view = this.dayviews.get(day.cid);
            task_view.render().$el.appendTo(day_view.$el.find('ul.tasklist'));
            this.show();
            task_view.delegateEvents();
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
                this.current_tasks.renderTask(this.get(task.cid));
            } else {
                this.current_tasks.render();
                this.finished_tasks.renderTask(this.get(task.cid));
            }
        },

        addTask: function () {
            var $form = this.$el.find('form.tracker-form'),
                $taskname = $form.find('#task-name'),
                $labels = $form.find('#labels'),
                arr = $taskname.attr('value').split('@'),
                desc = arr[0],
                cat = arr[1] || '',
                m = moment();
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
                this.stopCurrentTask();
                setTimeout(function () {
                    this.addTask().clearForm();
                }.bind(this), 100);
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

        startTaskFromLink: function (ev) {
            ev.preventDefault();
            this.stopCurrentTask();
            var i,
                labels = [],
                $link = $(ev.target),
                $parent = $link.parent(),
                $labels = $parent.find('.label'),
                cat = $link.parent().find('.category').text(),
                desc = $link.text();
            for (i=0; i < $labels.length; i++) {
                labels.push($labels[i].innerText);
            }
            this.model.create({
                'description': desc,
                'start': moment().format(),
                'start_day': start_iso.split('T')[0]+'T00:00:00Z',
                'start_month': start_date.getUTCFullYear()+"-"+start_date.getUTCMonth()+"-1"+'T00:00:00Z',
                'end': undefined,
                'category': cat,
                'labels': labels
                });
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

    klokwerk.Day = Backbone.Model.extend({
        initialize: function (attributes, options) {
            this.set(attributes);
        }
    });

    klokwerk.DayView = Backbone.View.extend({
        tagName: 'span',
        className: 'day-section',

        initialize: function () {
            this.model.on('change', function () {
                this.render();
            }, this);
        },

        render: function () {
            if (!this.$el.children().length) {
                this.$el.attr("data-day", this.model.get('day_iso'));
            }
            var duration = moment.duration(this.model.get('duration'), 'seconds');
            this.$el.html(
                $(klokwerk.templates.day({
                    day_iso: this.model.get('day_iso'),
                    day_human: this.model.get('day_human'),
                    hours: duration.hours(),
                    minutes: duration.minutes()
                })
            ));
            $(klokwerk.templates.tasklist()).appendTo(this.$el);
            return this;
        }
    });

    klokwerk.Days = Backbone.Collection.extend({
        model: klokwerk.Day
    });

    klokwerk.initialize = function () {
        $('.help_button').popover();
        $('.datepicker').datepicker('show');
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

