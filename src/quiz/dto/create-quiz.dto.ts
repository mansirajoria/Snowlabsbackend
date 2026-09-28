import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  ArrayNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';

class QuizOptionDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  text: string;
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
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
  //@ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options: QuizOptionDto[];

  @ApiProperty()
  @IsNumber()
  correctAnswer: number;
}

export class QuizQuestion {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ type: CreateQuizDto, isArray: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  // @ValidateNested({ each: true })
  @Type(() => CreateQuizDto)
  questions: CreateQuizDto[];

  @ApiProperty({
    example: '2023-06-19',
  })
  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @ApiProperty()
  quizName: string;

  @IsNumber()
  @ApiProperty()
  duration: number;
}

export class BulkUploadQuestion {
  @ApiProperty({ type: CreateQuizDto, isArray: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  //@ValidateNested({ each: true })
  @Type(() => CreateQuizDto)
  questions: CreateQuizDto[];
}
