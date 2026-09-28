import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateBlogCategoryDTO {
  @ApiProperty({ example: 'Frontend Development' })
  @IsNotEmpty()
  name: string;
}
