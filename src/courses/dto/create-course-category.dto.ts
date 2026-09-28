import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { NoEmptyStrings, ArrayLength } from '@utils/custom-validator';
import { IndustryTrends } from '@courses/entities/industry-trends.entity';
import { Type } from 'class-transformer';
import { CategoryStats } from '@courses/entities/category-stats.entity';

interface Faq {
  question: string;
  answer: string;
}

class IndustryTrendDTO {
  @ApiProperty()
  @IsNotEmpty()
  year: number;

  @ApiProperty()
  @IsNotEmpty()
  percentage: number;
}

class CategoryStatsDTO {
  @ApiProperty()
  @IsNotEmpty()
  stat: string;

  @ApiProperty()
  @IsNotEmpty()
  statement: string;
}

export class CreateCourseCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Frontend Development',
  })
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[^\s].*[^\s]$/, {
  //   message: 'Spaces are not allowed at the beginning or end of the string.',
  // })
  name: string;

  @ApiProperty()
  @IsString()
  slugName: string;

  @ApiProperty({ description: 'Description of the category' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'About of the category' })
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[^\s].*[^\s]$/, {
  //   message: 'Spaces are not allowed at the beginning or end of the string.',
  // })
  about: string;

  @ApiProperty({ description: 'PreRequisites or Eligibilityy' })
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[^\s].*[^\s]$/, {
  //   message: 'Spaces are not allowed at the beginning or end of the string.',
  // })
  preRequisites: string;

  @ApiProperty({ description: 'Who can take these courses' })
  @ArrayLength(9, { message: 'The array must contain exactly 9 Features' })
  @IsNotEmpty({ message: 'Features can not optional' })
  @IsArray()
  @ArrayNotEmpty() // Ensure the array is not empty
  @ArrayUnique({ message: 'Features should be Unique' }) // Ensure array elements are unique
  @IsString({ each: true }) // Validate each array element as a string
  @NoEmptyStrings({ message: 'Features can not be empty' })
  whoCanTake: string[];

  @ApiProperty({
    example: [
      {
        question: 'Do we need any documents to proceed with any course ?',
        answer: 'Lorem ipsum dolor sit amet. Aut iste amet ad architecto.',
      },
    ],
  })
  @IsArray()
  faq: Faq[];

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IndustryTrendDTO)
  arrayForChart: IndustryTrendDTO[];

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CategoryStatsDTO)
  SideData: CategoryStatsDTO[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  AboutImage: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  averageRating: string;
}
