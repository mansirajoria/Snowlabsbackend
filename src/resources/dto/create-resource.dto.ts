import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ResourceType } from '@utils/enum';

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resourceName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  resourceFile: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  resourceLink: string;

  @ApiProperty({ type: Boolean, default: false })
  @IsBoolean()
  @IsNotEmpty()
  isPublish: boolean;

  @ApiProperty({
    example: '2023-06-19',
  })
  @IsString()
  @IsOptional()
  dueDate: string;
}
