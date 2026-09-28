import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCorporateLeadDTO } from './create-corporate-lead.dto';
import { IsEnum, IsOptional, isEnum } from 'class-validator';
import {
  CorporateLeadCategory,
  CorporateLeadStatus,
  LeadTrainerStatus,
  LeadsStatus,
  TechCallEnum,
  TrainerCostType,
} from '@utils/enum';

export class UpdateCorporateLeadDTO extends PartialType(
  CreateCorporateLeadDTO,
) {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsOptional()
  query?: string;

  @ApiProperty()
  @IsOptional()
  designation?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(LeadsStatus)
  leadStatus: LeadsStatus;

  @ApiProperty()
  @IsOptional()
  comments: string;

  @ApiProperty()
  @IsOptional()
  organization?: string;

  @ApiProperty()
  @IsOptional()
  contactNo?: string;

  @ApiProperty()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(CorporateLeadStatus)
  category?: CorporateLeadCategory;

  @ApiProperty()
  @IsOptional()
  @IsEnum(LeadTrainerStatus)
  trainerStatus: LeadTrainerStatus;

  @ApiProperty()
  @IsOptional()
  skillCategory: string;

  @ApiProperty()
  @IsOptional()
  trainer: string;

  @ApiProperty()
  @IsOptional()
  trainerCost?: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(TrainerCostType)
  trainerCostType: TrainerCostType;

  @ApiProperty()
  @IsOptional()
  trainerCostToClient: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(TrainerCostType)
  trainerCostTypeClient: TrainerCostType;

  @ApiProperty()
  @IsOptional()
  @IsEnum(TechCallEnum)
  techCall: TechCallEnum;

  @ApiProperty()
  @IsOptional()
  isOpened: boolean;
}
