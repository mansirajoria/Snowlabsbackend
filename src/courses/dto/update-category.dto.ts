import { PartialType } from '@nestjs/swagger';
import { CreateCourseCategoryDto } from './create-course-category.dto';

export class UpdateCourseCategoryDto extends PartialType(
  CreateCourseCategoryDto,
) {}
