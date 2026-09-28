import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PaymentDTO {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  number: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  currency: string;
}
