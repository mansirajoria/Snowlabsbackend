import * as moment from 'moment';

export function getMomentNow() {
  return new Date(moment().toString());
}
