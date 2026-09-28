import { ApiProperty } from '@nestjs/swagger';
import { BlogType } from '@utils/enum';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty()
  @IsNotEmpty()
  blogTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  slugName: string;

  @ApiProperty()
  @IsNotEmpty()
  bannerImg: string;

  @ApiProperty()
  @IsNotEmpty()
  topicsCovered: string[];

  @ApiProperty({ type: Array<{ text: string; image: string }> })
  @IsNotEmpty()
  @IsArray()
  content: Array<{
    heading: string;
    text: string;
    image: string;
    caption: string;
  }>;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  blogCategory: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(BlogType)
  blogType: BlogType;

  @ApiProperty()
  @IsOptional()
  authorBio?: string;

  @ApiProperty()
  @IsOptional()
  twitterId?: string;

  @ApiProperty()
  @IsOptional()
  instagramId?: string;

  @ApiProperty()
  @IsOptional()
  linkedinId: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  tags: string[];

  @ApiProperty()
  @IsOptional()
  metaTags: string;

  @ApiProperty()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsOptional()
  metaDescription: string;
}
