const fprintf = require('./fprintf');

module.exports = function (format, ...args) {
  return fprintf(process.stdout, format, ...args);
};
