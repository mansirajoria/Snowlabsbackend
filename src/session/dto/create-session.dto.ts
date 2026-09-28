import { BatchEntity } from '@batch/entities/batch.entity';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionName: string;

  @IsUUID()
  @IsNotEmpty()
  batch: BatchEntity;

  @IsDate()
  @IsOptional()
  sessionDate?: Date;

  @IsDate()
  @IsOptional()
  sessionEndDate?: Date;

  @IsString()
  @IsOptional()
  occurrenceId?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsNumber()
  index?: number;

  @IsString()
  @IsOptional()
  callId?: string;
}
