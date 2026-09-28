import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CareerQueryDto {
  @ApiProperty({ description: 'Page length for results' })
  @IsOptional()
  @IsString()
  pageLength: number;

  @ApiProperty({ description: 'Page number of results' })
  @IsOptional()
  @IsString()
  pageNo: number;

  @ApiProperty({ description: 'For searching job position with title' })
  @IsOptional()
  @IsString()
  searchName: string;
}
