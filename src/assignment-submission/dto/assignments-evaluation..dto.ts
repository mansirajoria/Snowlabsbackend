import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AssignmentEvaluation {
  @ApiProperty()
  @IsString()
  submissionId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  obtainMarks: number;

  @ApiProperty({ example: 'good' })
  @IsString()
  feedBack: string;
}
