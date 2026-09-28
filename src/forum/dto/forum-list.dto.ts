import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForumListDTO {
  @ApiProperty()
  @IsOptional()
  @IsString()
  categoryName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  batchId: string;
}
