import { ApiProperty } from '@nestjs/swagger';
import {
  EarningType,
  GenderEnum,
  StudentType,
  TrainerEarningType,
} from '@utils/enum';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class TrainerCostDto {
  @ApiProperty()
  @IsNumber()
  inrAmount: number;

  @ApiProperty()
  @IsNumber()
  dollorAmount: number;

  @ApiProperty({ default: TrainerEarningType.PER_BATCH })
  @IsEnum(TrainerEarningType)
  feesType: TrainerEarningType;
}
export class CreateTrainerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  // @IsPhoneNumber()
  @IsMobilePhone()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  workExp: string;

  @ApiProperty()
  @IsString()
  trainingExp: string;

  @ApiProperty()
  @IsString()
  qualification: string;

  @ApiProperty()
  @IsString()
  facebookProfile: string;

  @ApiProperty()
  @IsString()
  instragramProfile: string;

  @ApiProperty()
  @IsString()
  linkedInProfile: string;

  @ApiProperty()
  @IsString()
  resume: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ type: TrainerCostDto, isArray: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  // @ValidateNested({ each: true })
  @Type(() => TrainerCostDto)
  cost: TrainerCostDto[];

  @ApiProperty()
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/)
  gstNumber: string;
}
