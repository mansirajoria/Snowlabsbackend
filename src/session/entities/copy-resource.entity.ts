import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CopyResourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldSessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  newSessionId: string;
}
