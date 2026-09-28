import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateSessionDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isPublished: boolean;
}
