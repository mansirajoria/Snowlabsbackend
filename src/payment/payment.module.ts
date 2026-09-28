import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CoursesModule } from '@courses/courses.module';
import { BatchModule } from '@batch/batch.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '@payment/entities/payment.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { StudentsModule } from '@students/students.module';
import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { MailModule } from '@mail/mail.module';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { NotificationsModule } from '@notifications/notifications.module';
import { StripePaymentService } from './stripe-payment.service';
import { FeedbackSubmission } from 'feedbacks/entities/feedback-form-submission.entity';
import { Offers } from 'offers/entities/offers.entity';
import { OfferRedeemed } from 'offers/entities/offer-redeemed.entity';
import { Referral } from 'referral/entities/referral.entity';
import { CredentialEntity } from 'credential/entities/credential.entity';

@Module({
  imports: [
    CoursesModule,
    BatchModule,
    StudentsModule,
    TypeOrmModule.forFeature([
      Payment,
      AuthEntity,
      Course,
      Student,
      Enrollment,
      FeedbackSubmission,
      Offers,
      Referral,
      OfferRedeemed,
      CredentialEntity,
    ]),
    MailModule,
    NotificationsModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripePaymentService],
})
export class PaymentModule {}
