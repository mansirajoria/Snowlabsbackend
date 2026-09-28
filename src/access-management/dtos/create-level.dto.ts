import { IsArray, IsNotEmpty, IsString } from 'class-validator';

class LP {
  moduleId: string;
  read: boolean;
  write: boolean;
}

export class CreateLevelDto {
  @IsString()
  name: string;

  @IsArray()
  @IsNotEmpty()
  levelPermission: Array<LP>;
}
