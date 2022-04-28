const printf = require('printf');

module.exports = function (format, ...args) {
  return printf(format, ...args);
};
