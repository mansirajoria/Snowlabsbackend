import { ApiProperty } from '@nestjs/swagger';
import { FeedBackType } from '@utils/enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchFeedBackDto {
  @ApiProperty()
  @IsEnum(FeedBackType)
  formType: FeedBackType;
}

export class CourseFeedbackDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  batchId: string;
}
