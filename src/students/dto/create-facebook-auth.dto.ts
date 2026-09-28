import { IsNotEmpty, IsString } from "class-validator"

interface UserInterface {
  email:string,
  firstName:string,
  lastName:string
}
export class FacebookDTO {

  @IsNotEmpty()
 user:UserInterface;

  @IsNotEmpty()
  @IsString()
  accessToken:string;

}
