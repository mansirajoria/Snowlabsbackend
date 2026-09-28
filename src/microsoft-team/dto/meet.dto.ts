import { ApiProperty } from '@nestjs/swagger';
import { SessionType } from '@utils/enum';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMeetDto {
  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsNotEmpty()
  @IsOptional()
  startDate: string;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsNotEmpty()
  @IsOptional()
  endDate: string;

  @ApiProperty({ example: '12:00PM' })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '14:00PM' })
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  weekDays: number[];

  @ApiProperty()
  @IsString()
  trainerId: string;

  @ApiProperty()
  @IsEnum(SessionType)
  @IsOptional()
  sessionType: SessionType;

  @IsOptional()
  courseName: string;

  @IsOptional()
  batchName: string;
}

export class UpdateMeetDto {
  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  newTrainerEmail: string;

  @IsOptional()
  oldTrainerEmail: string;

  @IsOptional()
  newTrainerName: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weekDays: number[];
}
