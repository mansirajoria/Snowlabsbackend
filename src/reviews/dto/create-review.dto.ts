import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, Max, Min } from "class-validator";

export class CreateReviewDto {

    @ApiProperty()
    @IsNotEmpty()
    @Min(1)
    @Max(5)
    rating:number

    @ApiProperty()
    @IsOptional()
    feedback?:string

    @ApiProperty()
    @IsNotEmpty()
    user:string

    @ApiProperty()
    @IsNotEmpty()
    courseId:string
}
