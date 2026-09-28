import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateOfferDto {
  @ApiProperty()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsOptional()
  details: string;

  @ApiProperty()
  @IsOptional()
  discountINR: number;

  @ApiProperty()
  @IsOptional()
  discountUSD: number;

  @ApiProperty()
  @IsOptional()
  discountPercentile: number;

  @ApiProperty()
  @IsOptional()
  couponCode: string;

  @ApiProperty()
  @IsOptional()
  isPublish: boolean;

  @ApiProperty()
  @IsOptional()
  isActive: boolean;

  @ApiProperty()
  @IsOptional()
  validFrom: string;

  @ApiProperty()
  @IsOptional()
  validTill: string;
}
