import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddTrainerSkillDto {
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
  @IsNotEmpty()
  rating: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  toc: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

// class Skill {
//   @ApiProperty()
//   @IsUUID()
//   @IsNotEmpty()
//   id: string;

//   @ApiProperty()
//   @IsString()
//   @IsNotEmpty()
//   rating: string;

//   @ApiProperty()
//   @IsString()
//   @IsNotEmpty()
//   commerce: string;

//   @ApiProperty()
//   @IsString()
//   @IsNotEmpty()
//   toc: string;

//   @ApiProperty()
//   @IsBoolean()
//   @IsNotEmpty()
//   isActive: boolean;
// }

// export class AddTrainerSkillDto {
//   @ApiProperty()
//   @IsNotEmpty()
//   @IsUUID()
//   id: string;

//   @ApiProperty({
//     example: [
//       {
//         id: 'Patterns in Java',
//         rating: 3,
//         commerce: 1000,
//         toc: 'this is table of content',
//         isActive: true,
//       },
//     ],
//   })
//   @IsNotEmpty()
//   @ValidateNested({ each: true })
//   @Type(() => Skill)
//   newSkill: Skill;
// }
