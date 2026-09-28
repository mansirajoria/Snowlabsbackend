import { ApiProperty } from '@nestjs/swagger';
import { TrainerQueryStatus } from '@utils/enum';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTrainerQueryDto {
  @ApiProperty({ enum: TrainerQueryStatus })
  @IsEnum(TrainerQueryStatus)
  @IsOptional()
  status: TrainerQueryStatus;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isOpened: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  comments: string;
}
