import { IsUUID } from 'class-validator';

export class FindDto {
  @IsUUID()
  id: string;
}
