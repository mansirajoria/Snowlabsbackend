import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FindTrainerDto {
  @ApiProperty({ description: 'Page number for pagination' })
  @IsString()
  @IsOptional()
  pageLength?: number;

  @ApiProperty({ description: 'Limit results per page' })
  @IsString()
  @IsOptional()
  pageNo?: number;

  @ApiProperty({ description: 'For batch Dropdown' })
  @IsString()
  @IsOptional()
  dropdown: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  trainerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  skillCategory?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  skill?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  keyword?: string;
}
