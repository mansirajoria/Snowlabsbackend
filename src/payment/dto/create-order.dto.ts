import { ApiPayloadTooLargeResponse, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDTO {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  batchId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  authId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  promoId: string;

  @ApiProperty()
  @IsOptional()
  isOffer: boolean;
}
