import {
  CacheStoreFactory,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailConfigService } from './mail/mail-config.service';
import { TrainerModule } from './trainer/trainer.module';
import authConfig from '@config/auth.config';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { SkillsModule } from './skills/skills.module';
import { FaqModule } from './faq/faq.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TrainingPlansModule } from './training-plans/training-plans.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { WebinarsModule } from './webinars/webinars.module';
import { MicrosoftTeamModule } from 'microsoft-team/microsoft-team.module';
import { BatchModule } from 'batch/batch.module';
import { MockTestModule } from './mockTest/mockTest.module';
import teamsConfig from '@config/teams.config';
import { ModuleModule } from '@access/module/module.module';
import { LevelModule } from '@access/level/level.module';
import { PaymentModule } from './payment/payment.module';
import { RazorpayModule } from 'nestjs-razorpay';
import { UploadsModule } from './uploads/uploads.module';
import mailConfig from '@config/mail.config';
import { BlogsModule } from '@blogs/blogs.module';
import { ScheduleModule } from '@nestjs/schedule';
// import cloudinaryConfig from '@config/cloudinary.config';
import { DashboardModule } from './dashboard/dashboard.module';
import { SecurityModule } from '@security/security.module';
import { QueryModule } from 'query/query.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { LeadsquareModule } from './leadsquare/leadsquare.module';
import { SessionModule } from './session/session.module';
import { ResourcesModule } from './resources/resources.module';
import { QuizModule } from './quiz/quiz.module';
import { RequestLoggerMiddleware } from '@utils/interceptors/request-logger.middleware';
import { StudentLmsModule } from './student-lms/student-lms.module';
import { CareerModule } from './career/career.module';
import { TrainerLmsModule } from './trainer-lms/trainer-lms.module';
import { CountryModule } from './country/country.module';
import { ReferralModule } from './referral/referral.module';
import { AssignmentModule } from 'assignment-submission/assignment.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QuizAnswerModule } from 'quiz-submission/quiz-submission.module';
import { RoiModule } from './roi/roi.module';
import { OffersModule } from 'offers/offers.module';
import paymentConfig from '@config/payment.config';
import { FeedbackModule } from 'feedbacks/feedback.module';
import { ForumModule } from './forum/forum.module';
import { ValidationMiddleware } from '@utils/middleware/validation.middleware';
import { AnalyticsModule } from './analytics/analytics.module';
import { CredentialModule } from 'credential/credential.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        teamsConfig,
        mailConfig,
        // cloudinaryConfig,
        paymentConfig,
      ],
      envFilePath: ['.env'],
    }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    RazorpayModule.forRoot({
      key_id: process.env.KEY_ID,
      key_secret: process.env.KEY_SECRET,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000,
    }),
    AuthModule,
    BlogsModule,
    LevelModule,
    ModuleModule,
    MailModule,
    CoursesModule,
    TrainerModule,
    SkillsModule,
    FaqModule,
    TrainingPlansModule,
    ReviewsModule,
    StudentsModule,
    WebinarsModule,
    MicrosoftTeamModule,
    BatchModule,
    MockTestModule,
    PaymentModule,
    RazorpayModule,
    UploadsModule,
    DashboardModule,
    SecurityModule,
    QueryModule,
    AnnouncementModule,
    LeadsquareModule,
    SessionModule,
    ResourcesModule,
    QuizModule,
    StudentLmsModule,
    CareerModule,
    TrainerLmsModule,
    CountryModule,
    ReferralModule,
    AssignmentModule,
    NotificationsModule,
    QuizAnswerModule,
    RoiModule,
    OffersModule,
    FeedbackModule,
    ForumModule,
    AnalyticsModule,
    CredentialModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware, ValidationMiddleware)
      .forRoutes('*');
  }
}
