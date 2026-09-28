import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class WorkExperienceDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty()
  @IsNotEmpty()
  workingFromDate: string;

  @ApiProperty()
  @IsOptional()
  workingTillDate: string;

  @ApiProperty()
  @IsNotEmpty()
  currentlyWorking: boolean;
}
