interface EnrollmentInterface {
  courseName: string;
  studentName: string;
  startDate: string;
  startTime: string;
  duration: number | string;
}

interface WebinarEnrollmentInterface {
  name: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes?: string;
  platform: string;
  meetingUrl: string;
}

interface WebinarCancelInterface {
  name: string;
  date: string;
  time: string;
}

interface SessionCancelInterface {
  date: string;
  time: string;
}

interface ChangeBatchInterface {
  name: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
}
