import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResourceQuery {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  @IsString()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsOptional()
  @IsString()
  pageNo?: number;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  resourceName: string;
}
