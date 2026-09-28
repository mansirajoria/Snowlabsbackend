export const getWeekdays = (input: number[]): string[] => {
  const weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const result = input.map((dayIndex) => {
    if (dayIndex >= 0 && dayIndex < weekdays.length) {
      return weekdays[dayIndex];
    } else {
      return 'Invalid Day';
    }
  });

  return result;
};

export const convertTo24HourFormat = (time: string): string => {
  const [inputTime, period] = time.split(' ');
  let [hour, minute] = inputTime.split(':');

  let hours: number = parseInt(hour);
  let minutes = parseInt(minute);

  if ((period === 'PM' || period === 'pm') && hours !== 12) {
    hours += 12;
  } else if ((period === 'AM' || period === 'am') && hours === 12) {
    hours = 0;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
};

export const convertTo24HourSuffix = (time: string): string => {
  const [inputTime, period] = time.split(' ');
  let [hour, minutes] = inputTime.split(':');

  let hours = parseInt(hour);
  let suffix = '';

  if (period === 'PM' && hours !== 12) {
    suffix = 'E';
  } else if (period === 'AM' && hours === 12) {
    suffix = 'M';
  } else if (hours <= 12) {
    suffix = 'M';
  } else {
    suffix = 'E';
  }

  return suffix;
};

export const convertISTtoUTC = (
  dateString: string,
  timeString: string,
): string => {
  const dateTimeString: string = dateString + ' ' + timeString;

  const istDate: Date = new Date(dateTimeString + ' GMT+0530');

  const utcYear: number = istDate.getUTCFullYear();
  const utcMonth: number = istDate.getUTCMonth() + 1; // Months are zero-indexed
  const utcDay: number = istDate.getUTCDate();
  const utcHours: number = istDate.getUTCHours();
  const utcMinutes: number = istDate.getUTCMinutes();
  const utcSeconds: number = istDate.getUTCSeconds();

  const utcDateString: string = `${utcYear}-${addLeadingZero(
    utcMonth,
  )}-${addLeadingZero(utcDay)}`;
  const utcTimeString: string = `${addLeadingZero(utcHours)}:${addLeadingZero(
    utcMinutes,
  )}:${addLeadingZero(utcSeconds)}.000`;

  const utcDateTimeString: string = `${utcDateString} ${utcTimeString}`;

  return utcDateTimeString;
};

// Helper function to add leading zero to single-digit numbers
function addLeadingZero(number: number): string {
  return number < 10 ? '0' + number : String(number);
}

export const convertUTCtoIST = (utcTime: string): string => {
  const utcDateTime = new Date(utcTime);
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
  const istDateTime = new Date(utcDateTime.getTime() + istOffset);
  return istDateTime.toISOString();
};

export const isNextDate = (startTime: string, endTime: string) => {
  const [inputStartTime, periodStart] = startTime.split(' ');
  const [inputEndTime, periodEnd] = endTime.split(' ');
  if (
    (periodStart === 'PM' || periodStart == 'pm') &&
    (periodEnd === 'AM' || periodEnd == 'am')
  )
    return true;
  return false;
};
