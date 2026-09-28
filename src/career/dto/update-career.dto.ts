import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCareerDto } from './create-career.dto';
import { IsOptional, IsString } from 'class-validator';
import { PositionStatus } from '@utils/enum';

export class UpdateCareerDto extends PartialType(CreateCareerDto) {
  @ApiProperty()
  @IsOptional()
  @IsString()
  status: PositionStatus;
}
