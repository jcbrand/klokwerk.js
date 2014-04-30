define("klokwerk-templates", [
    "tpl!src/templates/current_tasks",
    "tpl!src/templates/day",
    "tpl!src/templates/finished_tasks",
    "tpl!src/templates/label",
    "tpl!src/templates/task",
    "tpl!src/templates/tasklist"
], function () {
    return {
        current_tasks:  arguments[0],
        day:            arguments[1],
        finished_tasks: arguments[2],
        label:          arguments[3],
        task:           arguments[4],
        tasklist:       arguments[5]
    };
});
