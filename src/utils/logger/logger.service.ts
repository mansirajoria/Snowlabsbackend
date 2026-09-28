// import { Injectable } from '@nestjs/common';
// import { createLogger, Logger } from 'winston';
// import loggerConfig from './logger.config';
// import * as chalk from 'chalk';

// @Injectable()
// export class LoggerService {
//   private logger: Logger;

//   constructor() {
//     this.logger = createLogger(loggerConfig);
//   }

//   log(message: string, context?: string) {
//     this.logger.info(chalk.green(message), { context });
//   }
//   error(message: string, trace?: string, context?: string) {
//     this.logger.error(chalk.red(message), { trace, context });
//   }
//   warn(message: string, context?: string) {
//     this.logger.warn(chalk.yellow(message), { context });
//   }
//   debug(message: string, context?: string) {
//     this.logger.debug(chalk.blue(message), { context });
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { createLogger, transports, format, Logger } from 'winston';

// @Injectable()
// export class LoggerService {
//   private logger: Logger;

//   constructor() {
//     const consoleTransport = new transports.Console({
//       format: format.combine(
//         format.timestamp(),
//         format.printf(({ level, message, context, timestamp }) => {
//           let formattedMessage = `${timestamp} [${level}] ${message}`;
//           if (context) {
//             formattedMessage += ` [${context}]`;
//           }
//           return this.applyColor(level, formattedMessage);
//         })
//       ),
//     });

//     this.logger = createLogger({
//       transports: [consoleTransport],
//     });
//   }

//   private applyColor(level: string, message: string): string {
//     switch (level) {
//       case 'info':
//         return `\x1b[34m${message}\x1b[0m`; // Blue color
//       case 'error':
//         return `\x1b[31m${message}\x1b[0m`; // Red color
//       case 'warn':
//         return `\x1b[33m${message}\x1b[0m`; // Yellow color
//       case 'debug':
//         return `\x1b[36m${message}\x1b[0m`; // Cyan color
//       default:
//         return message;
//     }
//   }

//   log(message: string, context?: string) {
//     this.logger.log('info', message, { context });
//   }

//   error(message: string, trace?: string, context?: string) {
//     this.logger.log('error', message, { trace, context });
//   }

//   warn(message: string, context?: string) {
//     this.logger.log('warn', message, { context });
//   }

//   debug(message: string, context?: string) {
//     this.logger.log('debug', message, { context });
//   }
// }
