import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@auth/auth.service';
import { Request } from '@security/client/request';
import { RoleType } from '@utils/enum';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, done: VerifiedCallback): Promise<any> {
    try {
      if (!req.headers['authorization']) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
      const accessToken = req.headers['authorization'].split(' ')[1];
      const decodedJwt = this.jwtService.decode(accessToken);

      const userId: string = decodedJwt['id'];
      let validUser = await this.authService.findByFields({
        where: { id: userId, isActive: true },
      });

      if (validUser.role == RoleType.SUB_ADMIN) {
        validUser = await this.authService.findUserWithPermissions(userId);
      }

      req.user = validUser;

      if (!validUser) {
        return done(
          new UnauthorizedException({
            message: 'User Not Found',
            statusCode: 404,
          }),
          false,
        );
      }
      return validUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}
