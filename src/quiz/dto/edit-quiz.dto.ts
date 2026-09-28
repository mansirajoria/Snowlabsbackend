import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class EditQuizDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  quizName: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  duration: number;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsString()
  @IsOptional()
  dueDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isPublish: boolean;
}

class QuizOptionDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  text: string;
}

export class EditQuizQuestion {
  @ApiProperty()
  @IsString()
  @IsOptional()
  question: string;

  @ApiProperty({
    type: [QuizOptionDto],
    example: [
      {
        id: 1,
        text: 'a1',
      },
      {
        id: 2,
        text: 'a2',
      },
      {
        id: 3,
        text: 'a3',
      },
      {
        id: 4,
        text: 'a4',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  //   @ValidateNested({ each: true })
  options: QuizOptionDto[];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  correctAnswer: number;
}
