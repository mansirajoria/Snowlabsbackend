import { ApiProperty } from '@nestjs/swagger';
import { LeadsCategory, LeadsStatus } from '@utils/enum';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export class QueryLeadDTO {
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
  @IsEnum(LeadsCategory)
  category: LeadsCategory;

  @ApiProperty()
  @IsOptional()
  queryId: string;
}
