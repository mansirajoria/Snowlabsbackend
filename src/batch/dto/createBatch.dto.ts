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
  IsBoolean,
} from 'class-validator';

export class CreateBatchDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty()
  @IsUUID()
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
  @IsEnum(FeeType)
  @IsOptional()
  feeType: FeeType;

  @ApiProperty()
  @IsNumber()
  inrAmount: number;

  @ApiProperty()
  @IsNumber()
  dollorAmount: number;

  // @ApiProperty()
  // @IsNumber()
  // labCost: number;

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
  @IsEnum(BatchTypeEnum)
  batchType: BatchTypeEnum;

  @ApiProperty()
  @IsNumber()
  totalSession: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  costId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batchId: string;

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

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isWeb: boolean;
}
