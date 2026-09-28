import { ApiProperty } from '@nestjs/swagger';
import { CorporateLeadCategory, LeadsCategory, LeadsStatus } from '@utils/enum';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export class QueryCorporateLeadDTO {
  @ApiProperty()
  @IsOptional()
  page: number;

  @ApiProperty()
  @IsOptional()
  limit: number;

  @ApiProperty()
  @IsOptional()
  search: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(LeadsStatus)
  status: LeadsStatus;

  @ApiProperty()
  @IsOptional()
  @IsEnum(CorporateLeadCategory)
  category: CorporateLeadCategory;

  @ApiProperty()
  @IsOptional()
  queryId: string;
}
