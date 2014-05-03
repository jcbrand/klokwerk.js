define("klokwerk-templates", [
    "tpl!current_tasks",
    "tpl!day",
    "tpl!day_heading",
    "tpl!finished_tasks",
    "tpl!label",
    "tpl!task",
    "tpl!tasklist"
], function () {
    return {
        current_tasks:  arguments[0],
        day:            arguments[1],
        day_heading:    arguments[2],
        finished_tasks: arguments[3],
        label:          arguments[4],
        task:           arguments[5],
        tasklist:       arguments[6]
    };
});
