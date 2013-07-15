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

        require.config({
            paths: {
                "underscore": "lib/underscore",
                "backbone": "lib/backbone",
                "localstorage": "lib/backbone.localStorage"
            },
            // define module dependencies for modules not using define
            shim: {
                'backbone': {
                    //These script dependencies should be loaded before loading
                    //backbone.js
                    deps: [
                        'underscore', 
                        'jquery'
                        ],
                    //Once loaded, use the global 'Backbone' as the
                    //module value.
                    exports: 'Backbone'
                },
                'underscore':   { exports: '_' }
            }
        });

        define('klokwerk', [
            "localstorage"
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

    klokwerk.Tracker = Backbone.Model.extend({
        initialize: function (desc) {
            this.set({
                'description' : desc
            });
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

        addTask: function () {
            var $form = this.$el.find('form.tracker-form'),
                $taskname = $form.find('#task-name'),
                $labels = $form.find('#labels'),
                arr = $taskname.attr('value').split('@'),
                desc = arr[0],
                cat = arr[1] || '';

            this.model.tasks.create({
                'description': desc,
                'start': klokwerk.toISOString(new Date()),
                'end': undefined,
                'category': cat,
                'labels': ($labels.val() || '').split(',')
                });
            $taskname.attr('value', '');
        },

        stopCurrentTask: function () {
            var i, tasks = this.model.tasks.where({end: undefined});
            for (i=0; i<tasks.length; i++) {
                tasks[i].stop();
            }
        },

        startTaskFromForm: function (ev) {
            ev.preventDefault();
            if (Modernizr.input.required) { // already validated via HTML5
                this.stopCurrentTask();
                this.addTask();
            } else {
                $form.validate({
                    highlight: function () {
                        $form.find('#task-name').addClass('error').wrap('<span class="control-group error"/>');
                    },
                    submitHandler: $.proxy(function () {
                        this.addTask();
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
            this.model.tasks.create({
                'description': desc,
                'start': klokwerk.toISOString(new Date()),
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
        },

        initialize: function () {
            this.model.tasks = new klokwerk.TrackerTasks();
            this.model.tasks.localStorage = new Backbone.LocalStorage('klokwerk'); // FIXME: proper id
            this.tasksview = new klokwerk.TrackerTasksView({'model': this.model.tasks});
            this.model.tasks.fetch({add:true});

            this.model.on('change', function (item, changed) {
                alert('Tracker has changed');
            });
        }
    });

    klokwerk.Task = Backbone.Model.extend({
        stop: function () {
            this.save({'end': klokwerk.toISOString(new Date())});
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
            '</div>'
        ),
        label_template: _.template('<span class="clickable label label-info">{{label}}</span>'),
        
        initialize: function () {
            this.model.on('change', function (item, changed) {
                this.render(); 
            }, this);
        },

        removeTask: function (ev) {
            ev.preventDefault();
            var that = this;
            $(ev.target).closest('li').hide(function () {
                that.model.destroy();
                this.remove();
            });
        },

        render: function () {
            var $section, $tasklist, end_iso, end_time, i, prefix,
                d = this.model.toJSON(),
                start = klokwerk.parseISO8601(this.model.get('start')),
                end = this.model.get('end');
            d.start_time = start.getHours()+':'+start.getMinutes();
            d.start_iso = klokwerk.toISOString(start);
            d.end = end;

            var $task_html = $(this.$el.html(this.task_template(d)));

            if (end !== undefined) {
                end = klokwerk.parseISO8601(end);
                end_time = end.getHours()+':'+end.getMinutes();
                end_iso = klokwerk.toISOString(end);
                $task_html.find('.task-times').append('<time>').attr('datetime',  end_iso).append(end_time);
                $task_html.removeClass('current-task');
                prefix = 'finished';
            } else {
                // XXX: We'll probably later still introduce the concept of
                // sticky tasks
                prefix = 'current';
            }
            $task_html.addClass(prefix+'-task');
            $section = $('#'+prefix+'-tasks-section');
            $tasklist = $section.find('ul.tasklist:first');
            if (prefix == 'current') {
                $tasklist.empty();
            }
            for (i=0; i<d.labels.length; i++) {
                $task_html.find('a.edit-task').before(this.label_template({label: d.labels[i]}));
            }
            $tasklist.append($task_html);
            if (!$section.is(':visible')) {
                $section.slideDown();
            }
            return this;
        }
    });

    klokwerk.TrackerTasks = Backbone.Collection.extend({
        model: klokwerk.Task
    });

    klokwerk.TrackerTasksView = Backbone.View.extend({
        el: 'ol#tracker_tasks',

        initialize: function () {
            this.taskviews = [];
            var $el = this.$el;
            this.model.on('add', $.proxy(function (item) {
                var view = new klokwerk.TaskView({'model': item});
                this.taskviews.push(view);
                view.render();
            }, this));
        }
    });

    $(document).ready($.proxy(function () {
        $('.help_button').popover();
        $('.datepicker').datepicker('show');
        $("#labels").select2({
            width: '80%',
            height: '20px',
            tags:["red", "green", "blue"],
            tokenSeparators: [";"]
        });
        this.tracker = new this.Tracker('Default Tracker');
        this.trackerview = new this.TrackerView({'model': this.tracker});
    }, klokwerk));

    return klokwerk;
}));

