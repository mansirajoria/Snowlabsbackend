import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindOfferDto {
  @ApiProperty({ description: 'Page length for results' })
  @IsOptional()
  @IsString()
  limit: number;

  @ApiProperty({ description: 'Page number of results' })
  @IsOptional()
  @IsString()
  page: number;
}
