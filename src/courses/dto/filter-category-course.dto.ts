import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterCategoryCourse {
  @ApiProperty()
  @IsOptional()
  @IsString()
  level: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  mod: string;
}
