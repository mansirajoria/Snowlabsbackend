import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryCategoryDTO {
  @ApiProperty()
  @IsString()
  @IsOptional()
  categoryId: string;
}
