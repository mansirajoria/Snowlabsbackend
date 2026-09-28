import { ApiProperty } from '@nestjs/swagger';

export class MicrosoftDriveDto {
  @ApiProperty()
  siteId: string;

  @ApiProperty()
  file: string;
}
