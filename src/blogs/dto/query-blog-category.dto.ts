import { ApiProperty } from '@nestjs/swagger';
import { BlogType } from '@utils/enum';
import { IsOptional } from 'class-validator';

export class QueryBlogCategoryDTO {
  @ApiProperty()
  @IsOptional()
  web: boolean = false;

  @ApiProperty()
  @IsOptional()
  blogType: BlogType = BlogType.Article;

  @ApiProperty()
  @IsOptional()
  name?: string = '';
}
