import { ApiProperty } from '@nestjs/swagger';
import { LeadsCategory, LeadsStatus, LearningObjectiveEnum } from '@utils/enum';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateLeadDTO {
  @ApiProperty({ description: 'Email of candidate', example: 'test@test.com' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Phone number of candidate',
    example: '9876543210',
  })
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Country code of lead', example: '+91' })
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ description: 'Name of candidate', example: 'Test Name' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Query content',
    example: 'Having problem with Course',
  })
  @IsOptional()
  query: string;

  @ApiProperty({
    description: 'COURSE_ADVISOR / COURSE_ENQUIRY',
    example: LeadsCategory.COURSEADVISOR,
  })
  @IsEnum(LeadsCategory)
  category: LeadsCategory;

  @ApiProperty()
  @IsOptional()
  certification?: string;

  @ApiProperty({ description: 'Title of the page need for leadsquared' })
  @IsOptional()
  pageName?: string;

  @ApiProperty({ description: 'Form name to uniquely identify forms' })
  @IsOptional()
  formName?: string;

  @ApiProperty({ description: 'Course name' })
  @IsOptional()
  course?: string;

  @ApiProperty()
  @IsOptional()
  courseId: string;

  @ApiProperty({
    description: 'Training Objective',
    example: LearningObjectiveEnum.CERTIFICATION,
  })
  @IsOptional()
  @IsEnum(LearningObjectiveEnum)
  trainingObjective?: LearningObjectiveEnum;

  @ApiProperty()
  @IsOptional()
  message?: string;
}
