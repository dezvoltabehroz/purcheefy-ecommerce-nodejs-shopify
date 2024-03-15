'use strict'

// Error handler
const errorHandler = (err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if (err.isJoi || err.hasOwnProperty('sqlMessage'))
    err.status = 422;

  res.status(422).json({ data: err, statusCode: err.status || 400 })
  // res.reply({ data: err, statusCode: err.status || 400 });
};

module.exports = errorHandler;
