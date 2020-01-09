const CosmosClient = require('@azure/cosmos').CosmosClient
const config = require('./config')
const TaskList = require('./routes/tasklist')
const TaskDao = require('./models/taskDao')

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Todo App:
const cosmosClient = new CosmosClient({
  endpoint: config.host,
  key: config.authKey
})
const taskDao = new TaskDao(cosmosClient, config.databaseId, config.containerId)
const taskList = new TaskList(taskDao)
taskDao
  .init(err => {
    console.error(err)
  })
  .catch(err => {
    console.error(err)
    console.error(
      'Shutting down because there was an error settinig up the database.'
    )
    process.exit(1)
  })

app.get('/', (req, res, next) => taskList.showTasks(req, res).catch(next))
app.post('/addtask', (req, res, next) => taskList.addTask(req, res).catch(next))
app.post('/completetask', (req, res, next) =>
  taskList.completeTask(req, res).catch(next)
)


app.use('/', indexRouter);
app.use('/users', usersRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
