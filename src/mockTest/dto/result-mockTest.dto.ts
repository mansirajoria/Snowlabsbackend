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
  @IsOptional()
  questionId: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  answer: number;
}

export class MockTestAnswerDto {
  @ApiProperty({ type: AnswerDto, isArray: true })
  @IsNotEmpty()
  @Type(() => AnswerDto)
  quizAnswer: AnswerDto[];
}
