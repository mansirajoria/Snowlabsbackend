import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddStudentBatchDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  students: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  batchId: string;
}
