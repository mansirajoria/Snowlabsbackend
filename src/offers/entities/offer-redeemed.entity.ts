import { Course } from '@courses/entities/course.entity';
import { Student } from '@students/entities/student.entity';
import { BaseEntity } from '@utils/base.entity';
import { Entity, ManyToOne } from 'typeorm';
import { Offers } from './offers.entity';

@Entity('offer-redeemed')
export class OfferRedeemed extends BaseEntity {
  @ManyToOne(() => Student, (student) => student.id)
  student: Student;

  @ManyToOne(() => Course, (course) => course.id)
  course: Course;

  @ManyToOne(() => Offers, (offer) => offer.id)
  offer: Offers;
}
