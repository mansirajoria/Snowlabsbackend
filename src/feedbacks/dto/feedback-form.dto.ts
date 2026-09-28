import { ApiProperty } from "@nestjs/swagger";
import { FeedBackType, QuestionType } from "@utils/enum";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";


class FeedbackOptionDto {
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    id: number;
  
    @ApiProperty()
    @IsString()
    @IsOptional()
    text: string;

}
export class FeedbackQuestion{
@ApiProperty()
@IsString()
question:string

@ApiProperty({
    type: [FeedbackOptionDto],
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
  @Type(() => FeedbackOptionDto)
  options: FeedbackOptionDto[];

  @ApiProperty()
  @IsEnum(QuestionType)
  questionType: QuestionType;

}


export class FeedbackFormDto {
 
    @ApiProperty({ type: FeedbackQuestion, isArray: true })
    @IsNotEmpty()
    @ArrayNotEmpty()
    //   @ValidateNested({ each: true })
    @Type(() =>FeedbackQuestion )
    feedback: FeedbackQuestion[];

    @ApiProperty()
    @IsEnum(FeedBackType)
    type: FeedBackType

    @ApiProperty()
    @IsOptional()
    sessionId:string
}