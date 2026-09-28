import { ApiProperty } from '@nestjs/swagger';
import { QueryCategory } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateHelpdeskDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty()
  @IsEnum(QueryCategory)
  @IsNotEmpty()
  queryType: QueryCategory;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  studentId: string;
}
