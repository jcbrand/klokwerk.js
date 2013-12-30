/*!
 * klokwerk.js 
 * http://opkode.com
 *
 * Copyright (c) Jan-Carel Brand (jc@opkode.com)
 * Dual licensed under the MIT and GPL Licenses
 */

/* The following line defines global variables defined elsewhere. */
/*globals jQuery, portal_url*/

// AMD/global registrations
(function (root, factory) {
    if (typeof define === 'function' && define.amd) { 
        define('klokwerk', [
            "klokwerk-dependencies"
            ], function () {
                // Use Mustache style syntax for variable interpolation
                _.templateSettings = {
                    evaluate : /\{\[([\s\S]+?)\]\}/g,
                    interpolate : /\{\{([\s\S]+?)\}\}/g
                };

                if (console===undefined || console.log===undefined) {
                    console = { log: function () {}, error: function () {} };
                }
                return factory(jQuery, _, console);
            }
        );
    } else { 
        // Browser globals
        _.templateSettings = {
            evaluate : /\{\[([\s\S]+?)\]\}/g,
            interpolate : /\{\{([\s\S]+?)\}\}/g
        };
        if (console===undefined || console.log===undefined) {
            console = { log: function () {}, error: function () {} };
        }
        root.klokwerk = factory(jQuery, _, console || {log: function(){}});
    }
}(this, function ($, _, console) {
    var klokwerk = {};

    klokwerk.toISOString = function (date) {
        var pad;
        if (typeof date.toISOString !== 'undefined') {
            return date.toISOString();
        } else {
            // IE <= 8 Doesn't have toISOStringMethod
            pad = function (num) {
                return (num < 10) ? '0' + num : '' + num;
            };
            return date.getUTCFullYear() + '-' +
                pad(date.getUTCMonth() + 1) + '-' +
                pad(date.getUTCDate()) + 'T' +
                pad(date.getUTCHours()) + ':' +
                pad(date.getUTCMinutes()) + ':' +
                pad(date.getUTCSeconds()) + '.000Z';
        }
    };
    klokwerk.parseISO8601 = function (datestr) {
        /* Parses string formatted as 2013-02-14T11:27:08.268Z to a Date obj.
        */
        var numericKeys = [1, 4, 5, 6, 7, 10, 11],
            struct = /^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}\.?\d*)Z\s*$/.exec(datestr),
            minutesOffset = 0,
            i, k;

        for (i = 0; (k = numericKeys[i]); ++i) {
            struct[k] = +struct[k] || 0;
        }
        // allow undefined days and months
        struct[2] = (+struct[2] || 1) - 1;
        struct[3] = +struct[3] || 1;
        if (struct[8] !== 'Z' && struct[9] !== undefined) {
            minutesOffset = struct[10] * 60 + struct[11];

            if (struct[9] === '+') {
                minutesOffset = 0 - minutesOffset;
            }
        }
        return new Date(Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]));
    };

    klokwerk.roundDate = function (date) {
        /* Return date rounded to the nearest minute. */
        var coeff = 1000*60;
        var millis = Math.round((date || new Date()).getTime()/(coeff))*coeff;
        return new Date(millis);
    };

    klokwerk.Task = Backbone.Model.extend({
        stop: function () {
            var end_date = klokwerk.roundDate();
            var end_iso = klokwerk.toISOString(end_date);
            this.save({
                'end': end_iso,
                'end_day': end_iso.split('T')[0]+'T00:00:00Z',
                'end_month': end_date.getUTCFullYear()+"-"+end_date.getUTCMonth()+"-1"+'T00:00:00Z'
            });
        },

        isCurrentTask: function () {
            return this.get('end') === undefined;
        }
    });

    klokwerk.TaskView = Backbone.View.extend({
        tagName: 'li',
        className: 'clearfix',
        events: {
            "click a.remove-task": "removeTask"
        },

        task_template: _.template(
            '<div class="task-times">'+
                '<time datetime="{{start_iso}}">{{start_time}}</time> - '+
                '{[ if (end) { ]} <time datetime="{{end_iso}}">{{end_time}}</time> {[ } ]}'+
            '</div>'+
            '<div class="task-details">'+
                '{[ if (end) { ]}' +
                    '<a class="task-name" href="#">{{description}}</a>'+
                '{[ } ]}'+
                '{[ if (!end) { ]}' +
                    '<strong class="task-name">{{description}}</strong>'+
                '{[ } ]}'+
                '{[ if (category) { ]}' +
                    '<span class="category">{{category}}</span>'+
                '{[ } ]}'+
                '<a href="#" class="edit-task icon-pencil"></a>'+
                '<a href="#" class="remove-task icon-remove"></a>'+
            '</div>'+
            '<div class="task-spent">'+
                '<time class="spent pull-right">'+
                    '{[ if (hours) { ]}'+
                        '<span class="hours">{{hours}}</span>'+
                    '{[ } ]}'+
                    '<span class="minutes">{{minutes}}</span>'+
                '</time>'+
            '</div>'
        ),

        label_template: _.template('<span class="clickable label label-info">{{label}}</span>'),

        initialize: function () {
            this.model.on('change', function (item, changed) {
                this.render(); 
            }, this);
        },

        render: function () {
            var $task_html, end_iso, end_time, i, prefix,
                d = this.model.toJSON(),
                start = klokwerk.parseISO8601(this.model.get('start')),
                end = this.model.get('end'),
                minutes = start.getMinutes().toString();
            d.start_time = start.getHours()+':'+(minutes.length === 1 ? '0'+minutes: minutes);
            d.start_iso = klokwerk.toISOString(start);
            d.end = end;
            if (end !== undefined) {
                end = klokwerk.parseISO8601(end);
                prefix = 'finished';
            } else {
                end = klokwerk.roundDate();
                prefix = 'current';
            }
            minutes = end.getMinutes().toString();
            d.end_time = end.getHours()+':'+(minutes.length === 1 ? '0'+minutes: minutes);
            d.end_iso = klokwerk.toISOString(end);
            d.minutes = (end-start)/(1000*60);
            d.hours = Math.floor(d.minutes/60);
            d.minutes = Math.round(d.minutes-(d.hours*60));
            $task_html = $(this.$el.html(this.task_template(d)));
            if (prefix == 'finished') {
                $task_html.removeClass('current-task');
            }
            $task_html.addClass(prefix+'-task');
            for (i=0; i<d.labels.length; i++) {
                $task_html.find('a.edit-task').before(this.label_template({label: d.labels[i]}));
            }
            return $task_html;
        },

        isCurrentTask: function () {
            return this.model.isCurrentTask();
        },

        removeTask: function (ev) {
            ev.preventDefault();
            var $el = $(ev.target);
            $el.closest('li').hide($.proxy(function () {
                this.model.destroy();
                this.$el.remove();
                if (this.$el.closest('ul.tasklist').length === 0) {
                    if (this.isCurrentTask()) {
                        // remove the "Current Task" section
                        if (klokwerk.trackerview.$current_section.is(':visible')) {
                            klokwerk.trackerview.$current_section.slideUp();
                        }
                    } else {
                        // TODO:
                        // If there aren't ANY other tasks, we remove the whole
                        // "Finished Tasks" section, otherwise we show a discreet
                        // message, like "No tasks for this day".
                    }
                }
            }, this));
            return this;
        }
    });

    klokwerk.Tracker = Backbone.Collection.extend({
        model: klokwerk.Task,

        current: function () {
            return this.where({end: undefined});
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

        day_template: _.template(
            '<span class="day-section" data-day="{{day_iso}}">'+
                '<p class="row-fluid day-heading">'+
                    '<span class="span10"><time class="day-heading" datetime="{{day_iso}}">{{day_human}}</time></span>'+
                    '<span class="span2"><time class="spent pull-right"><span class="hours">12</span><span class="minutes">35</span></time></span>'+
                '</p>'+
                '<ul class="unstyled tasklist"></ul>'+
            '</span>'
        ),
        
        initialize: function () {
            this.$current_section = $('#current-tasks-section');
            this.taskviews = {};
            this.model.on('add', $.proxy(function (item) {
                var view = new klokwerk.TaskView({'model': item});
                this.taskviews[item.cid] = view;
                this.render(item);
            }, this));
            this.model.fetch({add:true});
            this.model.on('change', this.render, this);
        },

        render: function (item) {
            var taskview = this.taskviews[item.cid];
            var $current_tasklist = this.$current_section.find('ul.tasklist:first').empty();
            if (item.isCurrentTask()) {
                $current_tasklist.empty().append(taskview.render());
                // Show the current tasks section if it's hidden.
                if (!this.$current_section.is(':visible')) {
                    this.$current_section.slideDown();
                }
            } else {
                var $finished_section = $('#finished-tasks-section');
                var day_iso = item.get('end').split('T')[0] + 'T00:00:00Z';
                var $day_section = $('span.day-section[data-day="'+day_iso+'"]');
                var all_isos, index;
                if (!$day_section.length) {
                    $day_section = $(this.day_template({
                        'day_human': klokwerk.parseISO8601(day_iso).toDateString(),
                        'day_iso': day_iso
                    }));
                    all_isos = $('span.day-section').map(function() {return $(this).attr('data-day');}).get();
                    all_isos.push(day_iso);
                    index = all_isos.sort().reverse().indexOf(day_iso);
                    if (index === 0) {
                        $finished_section.find('legend').after($day_section);
                    } else {
                        $('span.day-section[data-day="'+all_isos[index-1]+'"]').after($day_section);
                    }
                }
                $day_section.find('ul.tasklist:first').append(taskview.render());
                // Hide the current tasks section if there aren't any tasks there
                // anymore.
                if ($current_tasklist.children().length === 0) {
                    this.$current_section.hide();
                }
                // Show the finished tasks section if it's hidden.
                if (!$finished_section.is(':visible')) {
                    $finished_section.slideDown();
                }
            }
            taskview.delegateEvents();
            return this;
        },

        addTask: function () {
            var $form = this.$el.find('form.tracker-form'),
                $taskname = $form.find('#task-name'),
                $labels = $form.find('#labels'),
                arr = $taskname.attr('value').split('@'),
                desc = arr[0],
                cat = arr[1] || '',
                start_date = klokwerk.roundDate(),
                start_iso = klokwerk.toISOString(start_date);

            this.model.create({
                'description': desc,
                'start': start_iso,
                'start_day': start_iso.split('T')[0]+'T00:00:00Z',
                'start_month': start_date.getUTCFullYear()+"-"+start_date.getUTCMonth()+"-1"+'T00:00:00Z',
                'end': undefined,
                'category': cat,
                'labels': ($labels.val() || '').split(',')
                });
            $taskname.attr('value', '');
            return this;
        },

        stopCurrentTask: function () {
            _.each(this.model.current(), function (el, idx, ls) {
                el.stop();
            });
            return this;
        },

        clearForm: function () {
            var $form = this.$el.find('form.tracker-form');
            $form.find('input#task-name').val();
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
                'start': klokwerk.toISOString(klokwerk.roundDate()),
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

    klokwerk.initialize = function () {
        $('.help_button').popover();
        $('.datepicker').datepicker('show');
        $("#labels").select2({
            width: '80%',
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

