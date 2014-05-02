define("klokwerk-templates", [
    "tpl!src/templates/current_tasks",
    "tpl!src/templates/day",
    "tpl!src/templates/day_heading",
    "tpl!src/templates/finished_tasks",
    "tpl!src/templates/label",
    "tpl!src/templates/task",
    "tpl!src/templates/tasklist"
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
