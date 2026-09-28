import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { JobStatus } from '@utils/enum';

export class UpdateApplicantDto {
  @ApiProperty()
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;
}
