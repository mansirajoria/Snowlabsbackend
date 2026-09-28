import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementTo } from '@utils/enum';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Trainers' })
  @IsString()
  @IsNotEmpty()
  userBase: AnnouncementTo;

  @ValidateIf((i) => i.userBase == AnnouncementTo.BATCH)
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  courseId: string;

  @ValidateIf((i) => i.userBase == AnnouncementTo.BATCH)
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  batchId: string;

  @ApiProperty({
    example: 'This is to announce thier will be no class for today',
  })
  @IsString()
  @IsNotEmpty()
  annocuncement: string;
}
