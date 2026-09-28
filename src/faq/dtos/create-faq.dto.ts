import { ApiProperty } from '@nestjs/swagger';
import { FaqType } from '@utils/enum';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Faq {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionNo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty()
  @IsEnum(FaqType)
  @IsNotEmpty()
  type: FaqType;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

export class CreateFaqDTO {
  @ApiProperty({
    type: Faq,
    isArray: true,
    example: [
      {
        questionNo: '1',
        question: 'what is hello world ?',
        answer: 'It is very basic program',
        type: 'Commmon OR Student OR Trainer',
        isActive: 'true',
      },
    ],
  })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Faq)
  faq: Faq[];

  @ApiProperty()
  @IsEnum(FaqType)
  @IsNotEmpty()
  type: FaqType;
}
