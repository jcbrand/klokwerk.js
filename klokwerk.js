/*!
 * Klokwork.js 
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
            // paths: {
            //     "patterns": "lib/Patterns"
            // },
            // define module dependencies for modules not using define
            shim: {
                'lib/backbone': {
                    //These script dependencies should be loaded before loading
                    //backbone.js
                    deps: [
                        'lib/underscore', 
                        'jquery'],
                    //Once loaded, use the global 'Backbone' as the
                    //module value.
                    exports: 'Backbone'
                }
            }
        });

        define([
            "lib/backbone"
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
        root.klokwork = factory(jQuery, _, console || {log: function(){}});
    }
}(this, function ($, _, console) {
    klokwork = {};

    klokwork.toISOString = function (date) {
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

    klokwork.Tracker = Backbone.Model.extend({
        initialize: function (desc) {
            this.set({
                'description' : desc
            });
        }
    });

    klokwork.TrackerView = Backbone.View.extend({
        el: "div#tracker",
        events: {
            "submit form.tracker-form": "startTask"
        },

        addTask: function () {
            var $form = this.$el.find('form'),
                $taskname = $form.find('#task_name'),
                arr = $taskname.attr('value').split('@'),
                desc = arr[0],
                cat = arr[1] || 'uncategorized',
                now = new Date();
            this.model.tasks.add([{
                'description': desc,
                'start': now,
                'end': undefined,
                'category': cat 
                }]);
            $taskname.attr('value', '');
        },

        stopCurrentTask: function () {
            var task = this.model.tasks.pop();
            if (task !== undefined) {
                task.stop();
            }
        },

        startTask: function (ev) {
            ev.preventDefault();
            if (Modernizr.input.required) {
                this.stopCurrentTask();
                this.addTask();
            } else {
                $form.validate({
                    highlight: function () {
                        $form.find('#task_name').addClass('error').wrap('<span class="control-group error"/>');
                    },
                    submitHandler: $.proxy(function () {
                        this.addTask();
                    }, this)
                }); 
            }
        },

        initialize: function () {
            this.model.tasks = new klokwork.TrackerTasks();
            this.tasksview = new klokwork.TrackerTasksView({'model': this.model.tasks});

            this.model.on('change', function (item, changed) {
                alert('Tracker has changed');
            });
        }
    });

    klokwork.Task = Backbone.Model.extend({
        stop: function () {
            this.set({ 'end': new Date() });
        }
    });

    klokwork.TaskView = Backbone.View.extend({
        tagName: 'li',

        completed_template: _.template('<time datetime="{{start_iso}}">{{start_time}}</time>-<time datetime="{{end_iso}}">{{end}}</time> '+
                             '{{description}}<span class="help-inline">@{{category}}</span>'),

        current_template: _.template(''+
                            '<legend>Current Task'+
                                '<form class="pull-right form-search">'+
                                '<button class="btn" id="stop_task" type="submit">Stop Task</button>'+
                                '</form>'+
                            '</legend>'+
                            '<p class="current_task">'+
                                '<time>{{start_time}}</time> <strong class="task-desc">{{description}}</strong>'+
                                '<span class="category">{{category}}</span>'+
                                '<span class="label label-info">kitchen</span>'+
                                '<span class="label label-info">cleaning</span>'+
                                '<time class="spent pull-right"><span class="hours">12</span><span class="minutes">35</span><span class="seconds">03</span></time>'+
                            '</p>'),
        
        initialize: function () {
            this.model.on('change', function (item, changed) {
                alert('hello');
            }, this);
        },

        render: function () {
            var $section;
            var d = this.model.toJSON(),
                start = this.model.get('start'),
                end = this.model.get('end');
            d.start_time = start.getHours()+':'+start.getMinutes();
            d.start_iso = start.toISOString();

            if (end !== undefined) {
                d.end_time = end.getHours()+':'+end.getMinutes();
                d.end_iso = end.toISOString();
                this.$el.html(this.completed_template(d));
            } else {
                $section = $('#current-task-section').html(this.current_template(d));
                if (!$section.is(':visible')) {
                    $section.slideDown();
                }
            }
            return this;
        }
    });

    klokwork.TrackerTasks = Backbone.Collection.extend({});

    klokwork.TrackerTasksView = Backbone.View.extend({
        el: 'ol#tracker_tasks',

        initialize: function () {
            this.taskviews = [];
            var $el = this.$el;
            this.model.on('add', $.proxy(function (item) {
                view = new klokwork.TaskView({'model': item});
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
    }, klokwork));

    return klokwork;
}));

