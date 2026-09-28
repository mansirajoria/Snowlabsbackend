import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsOptional, IsString } from 'class-validator';

export class MockTestQuery {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  @IsString()
  pageLength?: string;

  @ApiProperty({ description: 'Limit results per page' })
  @IsOptional()
  @IsString()
  pageNo?: string;

  @ApiProperty({ description: 'Keyword for searching' })
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiProperty({ description: 'Keyword for searching' })
  @IsString()
  @IsOptional()
  categoryName: string;

  @ApiProperty({ description: 'Keyword for searching' })
  @IsString()
  @IsOptional()
  testName: string;

  @ApiProperty({ description: 'Keyword for searching' })
  @IsString()
  @IsOptional()
  createdDate: string;
}
