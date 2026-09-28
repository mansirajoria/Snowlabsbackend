import { ApiProperty } from '@nestjs/swagger';
import { uuid } from 'aws-sdk/clients/customerprofiles';
import { Type } from 'class-transformer';
import {
  IsArray,
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

export class SessionFeedbackDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({
    type: [FeedbackDto],
  })
  @IsArray()
  @Type(() => FeedbackDto)
  feedback: FeedbackDto[];

  @ApiProperty()
  @IsNumber()
  rating: number;
}
