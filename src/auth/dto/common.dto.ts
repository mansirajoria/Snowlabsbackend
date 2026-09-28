import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType, SessionType, SlugFilter } from '@utils/enum';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAuthDto {
  @ApiProperty({ example: 'Rock', required: true })
  @IsNotEmpty()
  name: string | null;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string | null;

  @ApiProperty({ example: 'test1@example.com', required: true })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: RoleType.SUB_ADMIN, enum: RoleType, required: true })
  @IsString()
  @IsOptional()
  role?: RoleType;

  @ApiProperty({ required: true })
  @IsString()
  level: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateSubAdminDto extends PartialType(CreateAuthDto) {}

export class SearchQueryDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Page number for pagination' })
  @IsString()
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsString()
  @IsOptional()
  pageNo?: number;
}

export class MailDto {
  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  subject: string;
}

export class CommonMailDTO {
  @ApiProperty()
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  text: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail({}, { message: 'Please enter a valid email' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  // @ApiProperty({ required: true })
  // @IsNotEmpty()
  // countryCode: string;

  @ApiProperty({ required: true })
  // @IsMobilePhone({ message: 'sd' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Please enter a valid Phone number',
  })
  @IsNotEmpty({ message: 'Please enter Phone number' })
  phoneNumber: string;
  // { message: 'Please enter a valid Phone number' })

  @ApiProperty()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[\d\W]).{8,}$/, {
    message: 'Password is not strong enough',
  })
  public password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  countryCode: string;

  @ApiProperty()
  @IsOptional()
  countryFlag?: string;

  @ApiProperty()
  @IsOptional()
  countryShortCode?: string;

  @ApiProperty()
  @IsOptional()
  country?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'test1@example.com' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string;
}

export class LoginCredsDto {
  @ApiProperty()
  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;
}

export class ConfirmAccount {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class SlugFilterDto {
  @ApiProperty()
  @IsString()
  slugName: string;

  @ApiProperty()
  @IsEnum(SlugFilter)
  filter: SlugFilter;
}
