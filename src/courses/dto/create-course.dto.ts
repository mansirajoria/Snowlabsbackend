import { ApiProperty } from '@nestjs/swagger';

import { LevelType } from '@utils/enum';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class TrainingPlan {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  inrAmount: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  dollorAmount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  features: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  publish: boolean;
}
class Currilculum {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  heading: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
class Faq {
  @ApiProperty()
  @IsNotEmpty()
  question: string;

  @ApiProperty()
  @IsNotEmpty()
  answer: string;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Course 1' })
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[^\s].*[^\s]$/, {
  //   message: 'Spaces are not allowed at the beginning or end of the string.',
  // })
  courseName: string;

  @ApiProperty({ example: 'This is an example description for a course' })
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[^\s].*[^\s]$/, {
  //   message: 'Spaces are not allowed at the beginning or end of the string.',
  // })
  courseDesc: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slugName: string;

  @ApiProperty()
  @IsOptional()
  courseCategory: string;

  @ApiProperty({ example: 40 })
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: ['JS', 'Java', 'DevOps'] })
  @IsNotEmpty()
  skillSet: string[];

  @ApiProperty({ example: 'BEGINNER' })
  @IsNotEmpty()
  courseLevel: LevelType;

  @ApiProperty()
  @IsNotEmpty()
  courseThumbnail: string;

  @ApiProperty()
  @IsNotEmpty()
  courseMedia: string;

  @ApiProperty()
  @IsOptional()
  courseSyllabus: string;

  @ApiProperty()
  @IsNotEmpty()
  certificationName: string;

  @ApiProperty()
  @IsNotEmpty()
  certificationImg: string;

  @ApiProperty()
  @IsNotEmpty()
  certificationDesc: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  about: string;

  @ApiProperty()
  @IsNotEmpty()
  courseFor: string;

  @ApiProperty()
  @IsNotEmpty()
  suitableFor: string;

  @ApiProperty()
  @IsNotEmpty()
  skillCovered: string;

  @ApiProperty({
    example: [
      {
        heading: 'Patterns in Java',
        content: 'Some java is not java its C++',
      },
    ],
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Currilculum)
  currilculum: Currilculum[];

  @ApiProperty({
    example: [
      {
        question: 'Do we need any documents to proceed with any course ?',
        answer: 'Lorem ipsum dolor sit amet. Aut iste amet ad architecto.',
      },
    ],
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Faq)
  faq: Faq[];

  @ApiProperty({
    example: [
      {
        name: 'Solo',
        description: 'this is a Solo TP',
        inrAmount: 20000,
        dollorAmount: 100,
        features: ['abc', 'cde', 'xyz'],
        publish: true,
      },
      {
        name: 'Self-Paced',
        description: 'this is a Self-Paced TP',
        inrAmount: 50000,
        dollorAmount: 300,
        features: ['abc', 'cde', 'xyz'],
        publish: true,
      },
      {
        name: 'Live',
        description: 'this is a Live TP',
        inrAmount: 5000,
        dollorAmount: 40,
        features: ['abc', 'cde', 'xyz'],
        publish: true,
      },
    ],
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  // @ValidateNested({ each: true })
  // @Type(() => TrainingPlan)
  trainingPlans: TrainingPlan[];

  @ApiProperty()
  @IsOptional()
  publish: boolean;

  @ApiProperty()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsOptional()
  metaDescription: string;

  @ApiProperty()
  @IsOptional()
  metaTags: string;
}
