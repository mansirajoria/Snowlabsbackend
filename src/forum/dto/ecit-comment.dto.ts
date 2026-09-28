import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class EditCommentDTO {
  @ApiProperty()
  @IsNotEmpty()
  comment: string;
}
