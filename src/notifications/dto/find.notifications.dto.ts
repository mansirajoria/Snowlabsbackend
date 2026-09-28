import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindNotificationsDto {
  @ApiProperty({ description: 'Page number of results' })
  @IsOptional()
  @IsString()
  pageNo: number;

  @ApiProperty({ description: 'Page length for results' })
  @IsOptional()
  @IsString()
  pageLength: number;

  

}
