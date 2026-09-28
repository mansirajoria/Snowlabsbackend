import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateForumDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  @IsString()
  batchId: string;

  @ApiProperty()
  @IsOptional()
  isGlobal: boolean;
}
