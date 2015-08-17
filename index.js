var asr2json = require('./src/asr2json');

if (module.parent) {
  module.export = asr2Json;
} else {
  var args = Array.prototype.slice.call(process.argv, 2);
  return asr2json.apply(null, args);
}