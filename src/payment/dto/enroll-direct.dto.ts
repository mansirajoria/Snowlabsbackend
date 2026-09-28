import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class EnrollDirectDTO {
  @ApiProperty()
  @IsNotEmpty()
  orderId: string;
}
