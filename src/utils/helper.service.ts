import * as bcrypt from 'bcryptjs';
import { Request } from '@security/client/request';
import HttpException from './exceptions/HttpException';
import { HttpStatus, Param } from '@nestjs/common';

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const generatePassword = () => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$&';
  const passwordLength = Math.floor(Math.random() * 5) + 8; // Random length between 8 and 12
  let password = '';

  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
};

export const getWeekendDates = (
  startDateStr: string,
  endDateStr: string,
): Date[] => {
  const weekendDates: Date[] = [];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return weekendDates;
};

export const getWeekdayDates = (
  startDateStr: string,
  endDateStr: string,
): Date[] => {
  const weekdayDates: Date[] = [];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdayDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return weekdayDates;
};

export const createSessionsForChosenDays = (
  startDate: string,
  endDate: string,
  chosenDays: number[],
): Date[] => {
  const sessionDates: Date[] = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  while (currentDate <= lastDate) {
    const dayOfWeek = currentDate.getDay();
    if (chosenDays.includes(dayOfWeek)) {
      sessionDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return sessionDates;
};

export const requestValidator = (req: Request) => {
  if (
    Object.values(req.query).length > 0 ||
    Object.values(req.params).length > 0
  ) {
    throw new HttpException(404, 'Page Not Found');
  }
};
