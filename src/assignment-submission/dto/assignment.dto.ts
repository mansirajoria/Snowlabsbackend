import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListDto {
  @IsOptional()
  @IsString()
  authId: string;

  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class DueAssignmentDto {
  @IsString()
  authId: string;
}
