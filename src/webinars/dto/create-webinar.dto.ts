import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '@utils/enum';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateWebinarDto {
  @ApiProperty({ description: 'Webinar name', example: 'ReactJs Webinar' })
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'http://s3.amazonaws.com/123543123.jpg' })
  @IsOptional()
  featuredImage?: string;

  @ApiProperty({
    example: 'In this course you will learn how to use reactjs from scratch',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'DLA-TRAINER-ID' })
  @IsNotEmpty()
  @IsUUID()
  trainer: string;

  @ApiProperty()
  @IsOptional()
  designation: string;

  @ApiProperty()
  @IsString()
  slugName: string;

  @ApiProperty()
  @IsOptional()
  profilePic: string;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '02:PM' })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '02:PM' })
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    example:
      'Mr. John Doe is an exeptional speaker and trainer for the reactjs technology',
  })
  @IsOptional()
  trainerBio: string;

  @ApiProperty({ example: 25 })
  @IsNotEmpty()
  noOfSeats: number;

  @ApiProperty({ default: false })
  @IsOptional()
  published: boolean;

  @ApiProperty()
  @IsOptional()
  recordingUrl: string;

  @ApiProperty()
  @IsEnum(Platform)
  @IsOptional()
  webinarPlatform: Platform;

  @ApiProperty()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsOptional()
  feesINR: number;

  @ApiProperty()
  @IsOptional()
  feesUSD: number;

  @ApiProperty()
  @IsOptional()
  coverImage: string;

  @ApiProperty()
  @IsOptional()
  whatYouWillLearnSection: string;

  @ApiProperty()
  @IsBoolean()
  isUpcoming: boolean;

  @ApiProperty()
  @IsOptional()
  metaTags: string;

  @ApiProperty()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsOptional()
  metaDescription: string;
}
