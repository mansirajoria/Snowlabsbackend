// import { LoggerOptions, transports, format } from 'winston';
// import * as path from 'path';
// import * as DailyRotateFile from 'winston-daily-rotate-file';

// const logsDirectory = path.resolve(__dirname, '../../../logs'); // Set the path to the logs folder

// const loggerConfig: LoggerOptions = {
//   level: 'info',
//   format: format.combine(format.timestamp(), format.json()),
//   transports: [
//     new transports.Console(),
//     new DailyRotateFile({
//       filename: path.join(logsDirectory, 'application-%DATE%.log'), // Set the log file path
//       datePattern: 'YYYY-MM-DD',
//       zippedArchive: true,
//       maxSize: '20m',
//       maxFiles: '1d',
//     }),
//   ],
// };

// export default loggerConfig;
