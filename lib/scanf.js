const scanf = require('scanf');

module.exports = function (format, ...args) {
  return scanf(format, ...args);
};
