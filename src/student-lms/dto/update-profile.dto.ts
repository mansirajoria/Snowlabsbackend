import { ApiProperty } from '@nestjs/swagger';
import { EducationDTO } from '@students/dto/education.dto';
import { WorkExperienceDTO } from '@students/dto/work-experience.dto';
import {
  GenderEnum,
  LearningObjectiveEnum,
  TrainingFundedEnum,
} from '@utils/enum';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';

export class UpdateProfileDTO {
  @ApiProperty({
    description: 'Linked URL of the student',
    example: 'www.linkedin.com/studentProfile',
  })
  @IsUrl()
  @IsOptional()
  linkedInUri: string;

  @ApiProperty({
    description: 'Facebook profile of the student',
    example: 'www.fb.com/profile',
  })
  @IsUrl()
  @IsOptional()
  facebookUri: string;

  @ApiProperty()
  @IsOptional()
  countryCode: string;

  @ApiProperty()
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Please enter a valid Phone number',
  })
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @ApiProperty({ example: 'John Smith' })
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(LearningObjectiveEnum)
  learningObjective: LearningObjectiveEnum;

  @ApiProperty()
  @IsOptional()
  dateOfBirth: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @ApiProperty()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsOptional()
  timeZone: string;

  @ApiProperty({ example: 'github.com/profile' })
  @IsUrl()
  @IsOptional()
  githubUri: string;

  @ApiProperty()
  @IsOptional()
  profilePicUri: string;

  @ApiProperty({
    example: [
      {
        designation: 'Manager',
        companyName: 'Antino',
        workingFromDate: '2023-08-19',
        workingTillDate: '2023-10-10',
        currentlyWorking: false,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({
    each: true,
    message: 'Please provide valid properties of work exp',
  })
  @Type(() => WorkExperienceDTO, {})
  workExperience: WorkExperienceDTO[];

  @ApiProperty({
    example: [
      {
        qualification: 'B.Tech',
        institutionName: 'IIT',
        studentFromDate: '2022-08-20',
        studentTillDate: '2023-08-09',
        currentlyStudent: false,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({
    each: true,
    message: 'Please provide valid properties of work exp',
  })
  @Type(() => EducationDTO)
  education: EducationDTO[];

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  interests: Array<string>;

  @ApiProperty()
  @IsOptional()
  newUser: boolean;

  @ApiProperty()
  @IsOptional()
  @IsEnum(TrainingFundedEnum)
  trainingFundedBy: TrainingFundedEnum;
}
