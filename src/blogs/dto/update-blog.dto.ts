import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {
  @ApiProperty()
  @IsOptional()
  authorName?: string;

  @ApiProperty()
  @IsOptional()
  blogTitle?: string;

  @ApiProperty()
  @IsOptional()
  slugName: string;

  @ApiProperty()
  @IsOptional()
  bannerImg?: string;

  @ApiProperty()
  @IsOptional()
  topicsCovered?: string[];

  @ApiProperty()
  @IsOptional()
  content?: Array<{
    heading: string;
    text: string;
    image: string;
    caption: string;
  }>;

  @ApiProperty()
  @IsOptional()
  twitterId?: string;

  @ApiProperty()
  @IsOptional()
  instagramId?: string;

  @ApiProperty()
  @IsOptional()
  linkedinId?: string;

  @ApiProperty()
  @IsOptional()
  tags?: string[];
}
