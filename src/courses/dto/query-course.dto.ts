import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CoursesQuery {
  @ApiProperty()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Page number for pagination' })
  @IsString()
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsString()
  @IsOptional()
  pageNo?: number;
}

export class CourseCategorySearchAdmin {
  @ApiProperty({ example: 'React' })
  @IsOptional()
  @IsString()
  name?: string;
}
