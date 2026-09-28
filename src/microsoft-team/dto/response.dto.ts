import { IsNotEmpty, IsSemVer, IsString, isNotEmpty } from 'class-validator';

export class ProfileDto {
  @IsNotEmpty()
  email: string;

  name: string;
}

export class MeetDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  link: string;

  @IsString()
  callId: string;
}
