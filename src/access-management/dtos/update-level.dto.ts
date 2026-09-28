import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

class LP {
  moduleId: string;
  read: boolean;
  write: boolean;
}

export class UpdateLevelDto {
  @IsNotEmpty()
  @IsUUID()
  levelId: string;

  @IsArray()
  @IsNotEmpty()
  levelPermission: Array<LP>;
}
