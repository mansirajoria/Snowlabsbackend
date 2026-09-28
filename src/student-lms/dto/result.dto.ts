import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResultDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  quizId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  submissionId?: string;
}
