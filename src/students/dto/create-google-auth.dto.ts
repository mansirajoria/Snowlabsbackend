import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from '@utils/enum';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ example: 'test1@example.com', required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty({ example: 'John', required: true })
  @IsNotEmpty()
  firstName: string | null;

  @ApiProperty({ example: 'Doe', required: true })
  @IsNotEmpty()
  lastName: string | null;

  @ApiProperty({ example: RoleType.STUDENT, enum: RoleType, required: true })
  @IsNotEmpty()
  role?: RoleType;

  hash?: string | null;
}
