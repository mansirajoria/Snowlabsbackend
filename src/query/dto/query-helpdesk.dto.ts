import { ApiProperty } from '@nestjs/swagger';
import {
  HelpDeskStatus,
  LeadsCategory,
  LeadsStatus,
  QueryCategory,
} from '@utils/enum';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export class QueryHelpdeskDTO {
  @ApiProperty()
  @IsOptional()
  page?: number;

  @ApiProperty()
  @IsOptional()
  limit?: number;

  @ApiProperty()
  @IsOptional()
  search?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(HelpDeskStatus)
  status?: HelpDeskStatus;

  @ApiProperty()
  @IsOptional()
  @IsEnum(QueryCategory)
  category?: QueryCategory;

  @ApiProperty()
  @IsOptional()
  queryId?: string;
}
