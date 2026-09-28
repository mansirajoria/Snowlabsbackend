import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { FeedBackType } from '@utils/enum';
import { uuid } from 'aws-sdk/clients/customerprofiles';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class FeedbackDto {
  @ApiProperty()
  @IsUUID()
  questionId: uuid;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  chooseOption: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  rating: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  comments: string;
}

export class FeedbackFormSubmitDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  submissionId: string;

  @ApiProperty({
    type: [FeedbackDto],
  })
  @IsArray()
  @Type(() => FeedbackDto)
  feedback: FeedbackDto[];

  @ApiProperty()
  @IsEnum(FeedBackType)
  type: FeedBackType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  rating: number;
}
