import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class meetDto {
  @ApiProperty({ example: 'test1@example.com', required: true })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SendInvitationDto {
  @ApiProperty({
    type: [meetDto],
  })
  @IsArray()
  //@ValidateNested({ each: true })
  @Type(() => meetDto)
  invitation: meetDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  meetingId: string;
}
