import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from './entities/auth.entity';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../security/strategy/jwt.strategy';
import { OutlookStrategy } from '@security/strategy/outlook.strategy';
import { MicrosoftTeamModule } from 'microsoft-team/microsoft-team.module';
import { GoogleStrategy } from '@security/strategy/google.strategy';
import { Student } from '@students/entities/student.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { Level } from '@access/level/entites/level.entity';
import { FacebookStrategy } from '@security/strategy/facebook.strategy';
import { LinkedInStrategy } from '@security/strategy/linkedin.strategy';
import { Course } from '@courses/entities/course.entity';
import { Blog } from '@blogs/entities/blog.entity';
import { Webinar } from '@webinars/entities/webinar.entity';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { WebinarEnrollment } from '@webinars/entities/webinar-enrollments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthEntity,
      Student,
      SubAdmin,
      Level,
      Course,
      Blog,
      Webinar,
      CourseCategory,
      WebinarEnrollment,
    ]),
    PassportModule,
    MailModule,
    MicrosoftTeamModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.secret'),
        signOptions: {
          expiresIn: configService.get('auth.expires'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OutlookStrategy,
    GoogleStrategy,
    FacebookStrategy,
    LinkedInStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
