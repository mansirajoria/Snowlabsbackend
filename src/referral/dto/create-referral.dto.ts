import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateReferralDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  emailId: string;

  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty()
  @IsOptional()
  courseName: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  authId: string;
}
