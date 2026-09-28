import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { enrollmentType } from '@utils/enum';

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsOptional()
  studentId: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  countryShortCode?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  timeZone: string;

  @ApiProperty()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty()
  @IsOptional()
  sendEmail: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  enrollmentType: enrollmentType;

  @ApiProperty()
  @IsOptional()
  countryFlag: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  batchId?: string;
}
