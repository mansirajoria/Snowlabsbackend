import { Strategy } from 'passport-outlook';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OutlookStrategy extends PassportStrategy(Strategy, 'outlook') {
  constructor() {
    super({
      clientID: process.env.OUTLOOK_CLIENT_ID,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
      callbackURL: process.env.OUTLOOK_CALLBACK_URI,
      passReqToCallback: true,
      scope: ['openid', 'profile', 'email'],
    });
  }
  async validate(req, accessToken, refreshToken, profile) {
    const { email, displayName } = profile;

    return {
      email,
      name: displayName,
      accessToken,
    };
  }
}
