import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlogType } from '@utils/enum';

export class BlogQueryDTO {
  @ApiProperty({ description: 'For searching blogs with title' })
  @IsOptional()
  @IsString()
  searchName: string;

  @ApiProperty({ description: 'Page length for results' })
  @IsOptional()
  @IsString()
  limit: number;

  @ApiProperty({ description: 'Page number of results' })
  @IsOptional()
  @IsString()
  page: number;

  @ApiProperty({ description: 'Type of blog ARTICLE,TUTORIAL,INTERVIEW' })
  @IsOptional()
  blogType: BlogType;

  @ApiProperty({ description: 'Blog category' })
  @IsOptional()
  @IsString()
  category: string;

  @ApiProperty()
  @IsOptional()
  filterId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  publishedDate: string;
}
