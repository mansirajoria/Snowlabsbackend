import { PartialType } from '@nestjs/swagger';
import { CreateBlogCategoryDTO } from './create-blog-category.dto';

export class UpdateBlogCategoryDTO extends PartialType(CreateBlogCategoryDTO) {}
