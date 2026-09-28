import { ApiProperty, ApiPropertyOptional, ApiQuery } from '@nestjs/swagger';
import { enrollmentType } from '@utils/enum';
import {
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class StudentQuery {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsString()
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsString()
  @IsOptional()
  pageNo?: number;

  @ApiProperty({ description: 'Keyword for searching' })
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiProperty({ description: 'Name of student' })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'ID of student' })
  @IsString()
  @IsOptional()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  enrollmentStatus: enrollmentType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  isActive: string;
}
