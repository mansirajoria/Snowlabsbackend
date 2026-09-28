import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchQuizDto {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsOptional()
  pageNo?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  quizName: string;

  @IsString()
  @IsOptional()
  sessionId: string;
}
