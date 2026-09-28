import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum, TrainerEarningType } from '@utils/enum';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTrainerCostDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  inrAmount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  dollorAmount: number;

  @ApiProperty({ default: TrainerEarningType.PER_BATCH })
  @IsEnum(TrainerEarningType)
  @IsOptional()
  feesType: TrainerEarningType;
}

export class UpdateTrainerInfoDto {
  @ApiProperty({ example: 'John Smith' })
  @IsOptional()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsMobilePhone()
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  qualification: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  workExp: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  trainingExp: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  gender: GenderEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  earningType: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  newUser: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  resume: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  profilePhoto: string;

  @ApiProperty({ example: 'www.linkedin.com/studentProfile' })
  @IsString()
  @IsOptional()
  linkedInProfile: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  instragramProfile: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  facebookProfile: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  countryCode: string;

  @ApiProperty({ type: UpdateTrainerCostDto, isArray: true })
  @IsOptional()
  // @ValidateNested({ each: true })
  @Type(() => UpdateTrainerCostDto)
  cost: UpdateTrainerCostDto[];

  @ApiProperty()
  @IsOptional()
  gstNumber: string;
}
