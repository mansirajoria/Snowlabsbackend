import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangeBatchDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  currentBatchId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  newBatchId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;
}
