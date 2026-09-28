import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateWebinarDto } from './create-webinar.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  isValidationOptions,
} from 'class-validator';
import { Platform } from '@utils/enum';

export class UpdateWebinarDto extends PartialType(CreateWebinarDto) {
  @ApiProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  slugName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  category?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  trainer?: string;

  @ApiProperty()
  @IsOptional()
  noOfSeats?: number;

  @ApiProperty()
  @IsOptional()
  designation?: string;

  @ApiProperty()
  @IsOptional()
  published?: boolean;

  @ApiProperty()
  @IsOptional()
  trainerBio?: string;

  @ApiProperty()
  @IsOptional()
  recordingUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(Platform)
  webinarPlatform?: Platform;

  @ApiProperty()
  @IsOptional()
  meetingUri?: string;

  @ApiProperty()
  @IsOptional()
  profilePic?: string;

  @ApiProperty()
  @IsOptional()
  featuredImage?: string;

  @ApiProperty()
  @IsOptional()
  feesINR?: number;

  @ApiProperty()
  @IsOptional()
  feesUSD?: number;

  @ApiProperty()
  @IsOptional()
  date?: string;

  @ApiProperty()
  @IsOptional()
  startTime?: string;

  @ApiProperty()
  @IsOptional()
  endTime?: string;

  @ApiProperty()
  @IsOptional()
  coverImage?: string;

  @ApiProperty()
  @IsOptional()
  whatYouWillLearnSection?: string;

  @ApiProperty()
  @IsOptional()
  metaTags?: string;

  @ApiProperty()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty()
  @IsOptional()
  metaDescription?: string;
}
