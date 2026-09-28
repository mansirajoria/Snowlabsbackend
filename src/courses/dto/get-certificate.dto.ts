import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetCertificateDTO {
  @ApiProperty()
  @IsOptional()
  name?: string = '';

  @ApiProperty()
  @IsOptional()
  certificateId?: string;

  @ApiProperty()
  @IsOptional()
  pageLength: number = 10;

  @ApiProperty()
  @IsOptional()
  pageNo: number = 1;
}
