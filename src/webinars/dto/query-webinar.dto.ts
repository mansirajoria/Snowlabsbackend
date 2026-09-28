import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class QueryWebinarDTO {
  @ApiProperty({ description: 'Title of the webinar' })
  @IsOptional()
  @IsString()
  search: string;

  @ApiProperty({ description: 'Page limit' })
  @IsOptional()
  limit: number;

  @ApiProperty({ description: 'Category ID of the webinar' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Trainer ID of the speaker' })
  @IsString()
  @IsOptional()
  speaker?: string;

  @ApiProperty({
    description: 'Date on which webinar was created (YYYY-MM-DD)',
    example: '2023-06-19',
  })
  @IsString()
  @IsOptional()
  date: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  recordingAvailable: string;

  @ApiProperty()
  @IsOptional()
  page: number;

  @ApiProperty()
  @IsOptional()
  filterId: string;

  @ApiProperty()
  @IsOptional()
  web: boolean;
}
