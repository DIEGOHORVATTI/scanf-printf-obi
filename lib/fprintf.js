const printf = require('printf');

module.exports = function (writeStream, format, ...args) {
  const str = printf(format, ...args);
  writeStream.write(str);

  return str.length;
};
