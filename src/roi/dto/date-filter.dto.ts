import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DateFilterDTO {
  @ApiProperty({ example: '03' })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiProperty({ example: '2023' })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiProperty({ example: 'sdet' })
  @IsString()
  @IsOptional()
  keyword: string;

  @ApiProperty({ description: 'Page number for pagination' })
  @IsString()
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsString()
  @IsOptional()
  pageNo?: number;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  courseId: string;
}
