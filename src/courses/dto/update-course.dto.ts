import { ApiProperty } from '@nestjs/swagger';
import { LevelType } from '@utils/enum';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

class TrainingPlan {
  @ApiProperty()
  @IsString()
  id: string;

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
  @IsOptional()
  heading: string;

  @ApiProperty()
  @IsOptional()
  content: string;
}

class Faq {
  @ApiProperty()
  @IsOptional()
  question: string;

  @ApiProperty()
  @IsOptional()
  answer: string;
}

export class UpdateCourseDto {
  @ApiProperty()
  @IsOptional()
  courseName: string;

  @ApiProperty()
  @IsOptional()
  courseDesc: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  slugName: string;

  @ApiProperty()
  @IsUUID()
  courseCategory: any;

  @ApiProperty()
  @IsOptional()
  duration: number;

  @ApiProperty()
  @IsOptional()
  skillSet: string[];

  @ApiProperty()
  @IsOptional()
  courseLevel: LevelType;

  @ApiProperty()
  @IsOptional()
  courseThumbnail: string;

  @ApiProperty()
  @IsOptional()
  courseMedia: string;

  @ApiProperty()
  @IsOptional()
  courseSyllabus: string;

  @ApiProperty()
  @IsOptional()
  certificationName: string;

  @ApiProperty()
  @IsOptional()
  certificationImg: string;

  @ApiProperty()
  @IsOptional()
  certificationDesc: string;

  @ApiProperty()
  @IsOptional()
  about: string;

  @ApiProperty()
  @IsOptional()
  courseFor: string;

  @ApiProperty()
  @IsOptional()
  suitableFor: string;

  @ApiProperty()
  @IsOptional()
  skillCovered: string;

  @ApiProperty()
  @IsOptional()
  currilculum: Currilculum[];

  @ApiProperty()
  @IsOptional()
  faq: Faq[];

  @ApiProperty()
  @IsOptional()
  trainingPlans: TrainingPlan[];

  @ApiProperty()
  @IsOptional()
  metaTags: string;

  @ApiProperty()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsOptional()
  metaDescription: string;

  @ApiProperty()
  @IsOptional()
  publish: boolean;
}
