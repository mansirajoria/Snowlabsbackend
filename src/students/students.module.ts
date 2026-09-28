import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { MailModule } from '@mail/mail.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '@security/strategy/google.strategy';
import { FacebookStrategy } from '@security/strategy/facebook.strategy';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { BatchModule } from '@batch/batch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, AuthEntity, Enrollment]),
    MailModule,
    PassportModule,
    BatchModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService, GoogleStrategy, FacebookStrategy],
  exports: [StudentsService],
})
export class StudentsModule {}
