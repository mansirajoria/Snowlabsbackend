import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ShiftBatchListDto {
  @ApiProperty()
  @IsString()
  batchId: string;
  @ApiProperty()
  @IsString()
  courseId: string;
}

export class ShiftBatchDto {
  @ApiProperty()
  @IsString()
  authId: string;

  @ApiProperty()
  @IsString()
  enrollId: string;

  @ApiProperty()
  @IsString()
  batchId: string;
}
