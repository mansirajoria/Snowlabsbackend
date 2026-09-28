import { ApiProperty } from '@nestjs/swagger';
import { InvoiceQueryCategory } from '@utils/enum';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateTrainerInvoiceDto {
  @ApiProperty()
  @IsEnum(InvoiceQueryCategory)
  @IsNotEmpty()
  invoiceCategory: InvoiceQueryCategory;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @ValidateIf((i) => i.invoiceCategory === InvoiceQueryCategory.WEBINAR)
  webinarId: string;

  @ApiProperty()
  @IsUUID()
  @ValidateIf((i) => i.invoiceCategory === InvoiceQueryCategory.COURSE)
  courseId: string;

  @ApiProperty()
  @IsUUID()
  @ValidateIf((i) => i.invoiceCategory === InvoiceQueryCategory.COURSE)
  batchId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
