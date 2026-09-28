import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UUID } from 'crypto';

export class SearchMockTestDto {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsOptional()
  pageNo?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  testName: String;

  @ApiProperty({
    description: 'Date on which mockTest was created (YYYY-MM-DD)',
    example: '2023-06-19',
  })
  @IsString()
  @IsOptional()
  date: String;

  @IsString()
  @IsOptional()
  categoryId: String;
}
