import { ApiProperty } from '@nestjs/swagger';
import { BatchTypeEnum } from '@utils/enum';
import { IsEnum, IsOptional, IsString, isEnum } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  @IsString()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsOptional()
  @IsString()
  pageNo?: number;
}

export class SearchBatchDto {
  @IsString()
  @IsOptional()
  authId: string;

  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsEnum(BatchTypeEnum)
  batchType: BatchTypeEnum;
}

export class LastSessionDto {
  @ApiProperty()
  @IsString()
  batchId: string;
}

export class PendingSessionDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}
