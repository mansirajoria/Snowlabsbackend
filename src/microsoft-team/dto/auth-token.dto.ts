import { IsNotEmpty } from 'class-validator';

export class AuthTokentDto {
  @IsNotEmpty()
  token_type: string;

  @IsNotEmpty()
  scope: string;

  @IsNotEmpty()
  expires_in: number;

  @IsNotEmpty()
  access_token: string;

  @IsNotEmpty()
  refresh_token: string;
}
