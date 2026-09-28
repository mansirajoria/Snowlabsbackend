import { ApiProperty } from '@nestjs/swagger';
import { TrainerQueryCategory } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTrainerQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({})
  @IsEnum(TrainerQueryCategory)
  @IsNotEmpty()
  queryCategory: TrainerQueryCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  trainerId: string;
}
