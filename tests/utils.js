(function (root, factory) {
    define("utils", [
        'jquery',
        'klokwerk',
        'mock'
    ],
        function($, klokwerk, mock) {
            return factory($, klokwerk, mock);
        });
}(this, function ($, klokwerk, mock) {
    var utils = {};

    utils.klokwerk = klokwerk;
    utils.mock = mock;
    
    utils.createTaskFromForm = function (desc, tags) {
        var $form = klokwerk.trackerview.$el.find('form.tracker-form');
        $form.find('input#task-name').val(desc);
        $form.find('input#labels').val(tags.join(','));
        $form.submit();
        return this;
    };

    utils.clearTracker = function () {
        window.localStorage.clear();
        if (klokwerk.trackerview) {
            klokwerk.trackerview.undelegateEvents();
        }
        utils.removeCurrentTasks().removeFinishedTasks();
    };

    utils.createTask = function (desc, start, end) {
        klokwerk.tracker.create({
            'description': desc,
            'start': moment(start).format(),
            'start_day': moment(start).startOf('day').format(),
            'start_month': moment(start).startOf('month').format(),
            'end': moment(end).format(),
            'category': '',
            'labels': ''
        });
    };

    utils.removeCurrentTasks = function () {
        $('#current-tasks-section').hide().find('ul.tasklist').empty();
        return this;
    };

    utils.removeFinishedTasks = function () {
        $('#finished-tasks-section').hide().find('span.day-section').remove();
        return this;
    };

    return utils;
}));
