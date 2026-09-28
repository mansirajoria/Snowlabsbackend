import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';


export class TakeMockTestDto {

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    mockTestId: string;

    @ApiProperty()
    @IsNumber()
    // @IsNotEmpty()
    correctAnswers: number;

}
