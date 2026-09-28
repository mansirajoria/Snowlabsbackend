import { ApiProperty } from '@nestjs/swagger';
import { WebinarCategory } from '@webinars/entities/webinar-category.entity';
import { IsOptional, IsString } from 'class-validator';

export class MyWebinarFilterDTO {
  @ApiProperty()
  @IsString()
  @IsOptional()
  category: WebinarCategory;
}
