import { ApiProperty } from '@nestjs/swagger';
import { QualificationEnum } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class EducationDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(QualificationEnum)
  qualification: QualificationEnum;

  @ApiProperty()
  @IsNotEmpty()
  institutionName: string;

  @ApiProperty()
  @IsNotEmpty()
  studentFromDate: string;

  @ApiProperty()
  @IsOptional()
  studentTillDate: string;

  @ApiProperty()
  @IsNotEmpty()
  currentlyStudent: boolean;
}
