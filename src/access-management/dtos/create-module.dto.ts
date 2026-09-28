import { IsString } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
