const Framework = require("./framework");
const Container = require("./container");
const TaskRole = require("./task")

function NewFrameWork (){
    return new Framework();
}

function NewContainer(){
    return new Container();
}

function NewTaskRole (){
    return new TaskRole();
}

exports.NewContainer = NewContainer;
exports.NewFrameWork = NewFrameWork;
exports.NewTaskRole = NewTaskRole;