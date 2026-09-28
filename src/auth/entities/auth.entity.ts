import {
  Entity,
  Column,
  Index,
  OneToOne,
  DeleteDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '@utils/base.entity';
import { GenderEnum, RoleType } from '@utils/enum';
import { Trainer } from '@trainer/entities/trainer.entity';
import { Student } from '@students/entities/student.entity';
import { SubAdmin } from '@auth/entities/sub-admin.entity';
import { Payment } from 'payment/entities/payment.entity';

@Entity('auth')
@Unique(['phoneNumber', 'deletedAt'])
export class AuthEntity extends BaseEntity {
  @Index()
  @Column({ name: 'fullName', nullable: true })
  name?: string;

  @Index()
  @Column({ name: 'email', length: 100, nullable: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.STUDENT })
  role: RoleType;

  @Index()
  @Column({
    name: 'phoneNumber',
    type: 'varchar',
    nullable: true,
  })
  phoneNumber: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ nullable: true })
  outLookToken: string;

  @Column({ nullable: true })
  outLookRefreshToken: string;

  @OneToOne(() => SubAdmin)
  subAdmin: SubAdmin;

  @OneToOne(() => Trainer)
  trainer: Trainer;

  @OneToOne(() => Student)
  student: Student;

  @OneToMany(() => Payment, (paymentEntity) => paymentEntity.id)
  payment: Payment[];

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @Column({ nullable: true, enum: GenderEnum })
  gender: GenderEnum;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true, default: true })
  isLogIn: boolean;

  @Column({ nullable: true })
  timeZone: string;

  // @BeforeInsert()
  // async setPassword() {
  //   this.password = await hashPassword(this.password);
  // }

  // @Exclude({ toPlainOnly: true })
  // private previousPassword: string;

  // @AfterLoad()
  // assignPass() {
  //   this.previousPassword = this.password;
  // }

  // @BeforeInsert()
  // async hashPass() {
  //   this.password = await hashPassword(this.password);
  // }

  // @BeforeUpdate()
  // async updatePassword() {
  //   if (this.previousPassword !== this.password) {
  //     this.password = await hashPassword(this.password);
  //   }
  // }
}
