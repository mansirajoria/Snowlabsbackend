import { Strategy } from 'passport-linkedin-oauth2';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URI,
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: false,
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const user = {
      email: profile.emails[0].value,
      fullName: profile.displayName,
      // picture: profile.photos[0].value,
      // accessToken,
      // refreshToken,
    };

    done(null, user);
  }
}
