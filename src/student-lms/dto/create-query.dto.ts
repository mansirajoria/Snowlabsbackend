import { ApiProperty } from '@nestjs/swagger';
import { QueryCategory } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateStudentQueryDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(QueryCategory)
  queryType: QueryCategory;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  query: string;
}
