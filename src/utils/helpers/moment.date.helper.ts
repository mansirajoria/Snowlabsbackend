import moment = require('moment');

export function getMomentNow() {
  return new Date(moment().toString());
}
