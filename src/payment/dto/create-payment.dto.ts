import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  gatewayOrderId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  paymentMode: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  paymentStatus: boolean;

  @ApiProperty({ required: true })
  @IsString()
  amount: number;

  @ApiProperty({ required: true })
  @IsString()
  currency: string;

  @ApiProperty({ required: false })
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  tax: number;

  @ApiProperty({ required: false })
  @IsString()
  promoCode: string;

  @ApiProperty({ required: false })
  @IsString()
  total: number;

  @ApiProperty({ required: false })
  @IsString()
  offlinePayment: boolean;

  @ApiProperty()
  @IsUUID()
  authId: string;

  @ApiProperty()
  @IsUUID()
  courseId: string;
}
