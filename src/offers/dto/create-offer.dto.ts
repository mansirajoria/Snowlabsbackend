import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OfferDto {
  @ApiProperty({ example: 'Diwali Sale' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'this is the best deal' })
  @IsString()
  details: string;

  @ApiProperty()
  @IsOptional()
  discountInINR: number;

  @ApiProperty()
  @IsOptional()
  discountInUSD: number;

  @ApiProperty()
  @IsNumber()
  discountPercentile: number;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsString()
  validFrom: string;

  @ApiProperty({ example: 'YYYY-MM-DD' })
  @IsString()
  validTill: string;

  @ApiProperty({ example: 'GDHVLH123' })
  @IsString()
  couponCode: string;
}
