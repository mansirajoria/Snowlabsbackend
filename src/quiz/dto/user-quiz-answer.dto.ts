import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';


export class TakeQuizDto {

    // @ApiProperty()
    // @IsUUID()
    // @IsNotEmpty()
    // userId: string

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    quizQuestionId: string

    @ApiProperty()
    @IsNumber()
    selectedAnswer: number;
    
}