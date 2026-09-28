import { ApiProperty } from '@nestjs/swagger';
import {
  BatchTypeEnum,
  ClassRoomType,
  FeeType,
  Platform,
  SessionType,
  StudentType,
} from '@utils/enum';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class UpdateBatchDto {
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  trainerId: string;

  @ApiProperty()
  @IsEnum(StudentType)
  @IsOptional()
  studentType: StudentType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  minSize: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  maxSize: number;

  @ApiProperty()
  @IsEnum(ClassRoomType)
  @IsOptional()
  classRoomType: ClassRoomType;

  @ApiProperty()
  @IsEnum(Platform)
  @IsOptional()
  @IsOptional()
  platform: Platform;

  @ApiProperty()
  @IsString()
  @IsOptional()
  meetLocation: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  meetLink: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batchId: string;

  @ApiProperty()
  @IsEnum(FeeType)
  @IsOptional()
  feeType: FeeType;

  @ApiProperty()
  @IsOptional()
  @IsEnum(BatchTypeEnum)
  batchType?: BatchTypeEnum;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  inrAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  dollorAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalDuration: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  startTime: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  endTime: string;

  @ApiProperty()
  @IsEnum(SessionType)
  @IsOptional()
  sessionType: SessionType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  totalSession: number;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  startDate: string;

  @ApiProperty({ example: 'YYYY-MMM-DD' })
  @IsString()
  @IsOptional()
  endDate: string;

  @ApiProperty({ example: [0, 1] })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  weekDays: number[];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  skills: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  meetingId: string;
}
