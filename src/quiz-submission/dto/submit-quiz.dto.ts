import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class AnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  answer: number;
}

export class QuizAnswerDto {
  @ApiProperty()
  @IsString()
  quizId: string;

  @IsString()
  @IsOptional()
  authId: string;

  @ApiProperty()
  @IsString()
  submissionId: string;

  @ApiProperty({ type: AnswerDto, isArray: true })
  @IsNotEmpty()
  @Type(() => AnswerDto)
  quizAnswer: AnswerDto[];
}
