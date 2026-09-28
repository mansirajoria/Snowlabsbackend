import { ApiProperty } from '@nestjs/swagger';
import { CorporateLeadCategory } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCorporateLeadDTO {
  @ApiProperty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty()
  @IsOptional()
  designation: string;

  @ApiProperty()
  @IsOptional()
  organization: string;

  @ApiProperty()
  @IsOptional()
  formName: string;

  @ApiProperty()
  @IsOptional()
  pageName: string;

  @ApiProperty()
  @IsNotEmpty()
  contactNo: string;

  @ApiProperty()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsEnum(CorporateLeadCategory)
  category: CorporateLeadCategory;

  @ApiProperty()
  @IsOptional()
  message?: string;
}
