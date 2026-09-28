import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateApplicantDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  career: string;

  @ApiProperty({ example: 'Superman' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(3)
  @MinLength(2)
  countryCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  linkedIn: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  skills: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resume: string;
}

export class ApplicantQueryDTO {
  @ApiProperty({ description: 'Page length for results' })
  @IsOptional()
  pageLength: number;

  @ApiProperty({ description: 'Page number of results' })
  @IsOptional()
  pageNo: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  searchName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  category: string;
}
