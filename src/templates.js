define("klokwerk-templates", [
    "tpl!src/templates/day",
    "tpl!src/templates/label",
    "tpl!src/templates/task"
], function () {
    return {
        day: arguments[0],
        label: arguments[1],
        task: arguments[2]
    };
});
