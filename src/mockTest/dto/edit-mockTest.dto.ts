import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsUUID,
  ArrayNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';

class MockTestOptionDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  text: string;
}
export class EditMockTest {
  @ApiProperty()
  @IsUUID()
  @IsOptional()
  categoryId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  image: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  duration: number;

  @ApiProperty()
  @IsOptional()
  metaTags?: string;

  @ApiProperty()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty()
  @IsOptional()
  metaDescription?: string;
}

export class EditQuestion {
  @ApiProperty()
  @IsString()
  @IsOptional()
  question: string;

  @ApiProperty({
    type: [MockTestOptionDto],
    example: [
      {
        id: 1,
        text: 'a1',
      },
      {
        id: 2,
        text: 'a2',
      },
      {
        id: 3,
        text: 'a3',
      },
      {
        id: 4,
        text: 'a4',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  //   @ValidateNested({ each: true })
  options: MockTestOptionDto[];

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  correctAnswer: number;
}
