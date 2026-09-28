import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubmitDto {
  @ApiProperty()
  @IsString()
  submissionLink: string;

  @ApiProperty()
  @IsString()
  assignmentId: string;

  @ApiProperty()
  @IsString()
  submissionId: string;
}
