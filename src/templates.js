define("klokwerk-templates", [
    "tpl!current_tasks",
    "tpl!day",
    "tpl!day_heading",
    "tpl!label",
    "tpl!querycontrols",
    "tpl!task",
    "tpl!task_edit",
    "tpl!tasklist"
], function () {
    return {
        current_tasks:  arguments[0],
        day:            arguments[1],
        day_heading:    arguments[2],
        label:          arguments[3],
        querycontrols:  arguments[4],
        task:           arguments[5],
        task_edit:      arguments[6],
        tasklist:       arguments[7]
    };
});
