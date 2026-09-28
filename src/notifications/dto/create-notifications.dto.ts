import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementTo } from '@utils/enum';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  isUUID,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'This is to announce thier will be no class for today',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

   @ApiProperty({
    example: 'This is to announce thier will be no class for today',
   })
  @IsString()
  @IsNotEmpty()
  description: string;

@ApiProperty()
@IsUUID()
@IsOptional()
  courseId?: string;

@ApiProperty()
@IsUUID()
@IsOptional()
  batchId?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  announcementId?: string;

  @ApiProperty()
  @IsNotEmpty()
  receiverType?: string;

  @ApiProperty()
   @IsUUID()
  @IsOptional()
  studentId?: string;
  
 @ApiProperty()
   @IsUUID()
  @IsOptional()
  trainerId?: string;

}
