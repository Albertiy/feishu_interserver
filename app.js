var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compression = require('compression')
var fs = require('fs');
var FileStreamRotator = require('file-stream-rotator');
var dayjs = require('dayjs');
var CONFIG = require('./config');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const logDirectory = CONFIG.application().logDirectory || 'log';
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
var accessLogfile = FileStreamRotator.getStream({
  date_format: 'YYYY-MM-DD',
  filename: path.join(logDirectory, 'access-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})
var errorLogfile = FileStreamRotator.getStream({
  date_format: 'YYYY-MM-DD',
  filename: path.join(logDirectory, 'error-%DATE%.log'),
  frequency: 'daily',
  verbose: false
})
logger.token('from', function (req, res) {
  return JSON.stringify(req.query) || '-';
});
logger.token('dAta', function (req, res) {
  return JSON.stringify(req.body) || '-nodata-';
});
logger.token('time', function (req, res) {
  return dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss.SSS");
});
logger.token('nextROw', function (req, res) {
  return "\r\n";
});
logger.format('customAccessLog', '[:time] :remote-addr :remote-user :method :url :from :dAta :status :referrer :response-time ms :user-agent :nextROw');
function skip(req) {
  return (req.url).indexOf('stylesheets') != -1 // 跳过样式表请求
}

app.use(compression()); // GZip压缩
app.use(logger('dev'));
app.use(logger('customAccessLog', { skip: skip, stream: accessLogfile }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  var now = new Date();
  var time = dayjs(now).format('YYYY-MM-DD HH:mm:ss');
  var meta = '[' + time + '] ' + req.method + ' ' + req.url + '\r\n';
  errorLogfile.write(meta + err.stack + '\r\n\r\n\r\n');
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
