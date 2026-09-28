import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryReferralDTO {
  @ApiProperty()
  @IsOptional()
  limit: number;

  @ApiProperty()
  @IsOptional()
  page: number;

  @ApiProperty()
  @IsOptional()
  date?: Date;
}
