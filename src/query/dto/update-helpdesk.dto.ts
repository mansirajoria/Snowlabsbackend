import { ApiProperty } from '@nestjs/swagger';
import { HelpDeskStatus } from '@utils/enum';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateHelpdeskDTO {
  @ApiProperty()
  @IsOptional()
  @IsEnum(HelpDeskStatus)
  status: HelpDeskStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  comments: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isOpened: boolean;
}
