import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JobType } from '@utils/enum';

export class CreateCareerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'New Delhi' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ example: 'Full_Time', enum: JobType })
  @IsNotEmpty()
  @IsString()
  jobType: JobType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  careerCategory: string;
}
