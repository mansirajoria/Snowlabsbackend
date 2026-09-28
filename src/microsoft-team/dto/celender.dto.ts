import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CelenderDto {
  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsNotEmpty()
  endDate: string;
}
