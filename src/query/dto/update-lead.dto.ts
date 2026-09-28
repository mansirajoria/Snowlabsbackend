import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeadDTO } from './create-lead.dto';
import { IsOptional } from 'class-validator';
import { HelpDeskStatus, LeadsCategory, LeadsStatus } from '@utils/enum';

export class UpdateLeadDTO extends PartialType(CreateLeadDTO) {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsOptional()
  query?: string;

  @ApiProperty()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty()
  @IsOptional()
  comments?: string;

  @ApiProperty()
  @IsOptional()
  category?: LeadsCategory;

  @ApiProperty()
  @IsOptional()
  status?: LeadsStatus;

  @ApiProperty()
  @IsOptional()
  helpdeskStatus?: HelpDeskStatus;

  @ApiProperty()
  @IsOptional()
  isOpened: boolean;
}
