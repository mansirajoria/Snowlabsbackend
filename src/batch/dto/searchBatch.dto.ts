import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchBatchDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  pageLength?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  pageNo?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  studentName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  accessStat?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  studentId?: string;
}
export class CommanBatchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
