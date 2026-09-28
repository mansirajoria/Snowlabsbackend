import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// class UpdateSkillDto {
// @ApiProperty()
// @IsUUID()
// @IsNotEmpty()
// id: string;

// @ApiProperty()
// @IsString()
// @IsOptional()
// rating: string;

// @ApiProperty()
// @IsBoolean()
// @IsOptional()
// status: boolean;

// @ApiProperty()
// @IsString()
// @IsOptional()
// commerce: string;

// @ApiProperty()
// @IsString()
// @IsOptional()
// toc: string;
// }

// export class UpdateTrainerSkillDto {
//   @ApiProperty()
//   @IsArray()
//   skill: Array<UpdateSkillDto>;
// }

export class UpdateTrainerSkillDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  tid: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  rating: string;

  @ApiProperty()
  @IsOptional()
  toc: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
