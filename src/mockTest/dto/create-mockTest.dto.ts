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
  id: number;

  @ApiProperty()
  @IsString()
  text: string;
}

export class CreateMockTestDto {
  @ApiProperty()
  @IsString()
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
  //   @ValidateNested({ each: true })
  @Type(() => MockTestOptionDto)
  options: MockTestOptionDto[];

  @ApiProperty()
  @IsNumber()
  correctAnswer: number;
}

export class MockTestQuestion {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ type: CreateMockTestDto, isArray: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  //   @ValidateNested({ each: true })
  @Type(() => CreateMockTestDto)
  questions: CreateMockTestDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  duration: number;

  @ApiProperty()
  @IsOptional()
  metaTags: string;

  @ApiProperty()
  @IsOptional()
  metaTitle: string;

  @ApiProperty()
  @IsOptional()
  metaDescription: string;
}
