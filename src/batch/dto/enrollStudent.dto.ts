import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty()
  @IsString()
  batchId: string;

  @IsBoolean()
  @IsOptional()
  isShifted?: boolean;
}

export class ChangeEnrollStatus {
  @ApiProperty()
  @IsBoolean()
  accessStat: boolean;
}
