import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  isNotEmpty,
} from 'class-validator';

export class EnrollWebinarDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  authID: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  webinarID: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  phone: string;
}
