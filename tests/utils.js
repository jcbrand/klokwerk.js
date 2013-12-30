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

    utils.createTask = function (desc, start, end) {
        var start_iso = klokwerk.toISOString(klokwerk.roundDate(start));
        var end_iso = klokwerk.toISOString(klokwerk.roundDate(end));
        klokwerk.tracker.create({
            'description': desc,
            'start': start_iso,
            'start_day': start_iso.split('T')[0]+'T00:00:00Z',
            'start_month': start.getUTCFullYear()+"-"+start.getUTCMonth()+"-1"+'T00:00:00Z',
            'end': end_iso,
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
