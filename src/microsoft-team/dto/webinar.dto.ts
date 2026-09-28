import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreateMeetDto } from './meet.dto';

export class CreateTeamsWebinarDto {
  @IsNotEmpty()
  webinarName: string;

  @IsNotEmpty()
  startDate: string;

  @IsNotEmpty()
  startTime: string;

  @IsNotEmpty()
  endTime: string;

  @IsNotEmpty()
  trainerId: string;
}
export class UpdateTeamsWebinarDto {
  @IsOptional()
  webinarName: string;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  newTrainerEmail: string;

  @IsOptional()
  oldTrainerEmail: string;

  @IsOptional()
  newTrainerName: string;
}
