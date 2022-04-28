const sscanf = require('scanf').sscanf;

module.exports = function (buffer, format, ...args) {
  return sscanf(buffer, format, ...args);
};
