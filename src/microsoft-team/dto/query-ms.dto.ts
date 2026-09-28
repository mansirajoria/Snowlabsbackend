import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class MicrosoftSearchDto {
  @ApiProperty()
  search: string;
}
