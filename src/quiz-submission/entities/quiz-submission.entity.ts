import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import { QuizStatusType } from '@utils/enum';
import { QuizEntity } from 'quiz/entities/create-quiz.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { Column, ManyToOne, OneToMany } from 'typeorm';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { QuizAttempts } from './quiz-attempts.entity';

@Entity('quiz-submissions')
export class QuizSubmission extends BaseEntity {
  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.resources,{cascade:true})
  session: SessionEntity;

  @ManyToOne(() => QuizEntity, (quizEntity) => quizEntity.id)
  quiz: QuizEntity;

  @ManyToOne(() => Student, (student) => student.id, { nullable: true })
  student: Student;

  @ManyToOne(() => Trainer, (trainer) => trainer.id, { nullable: true })
  trainer: Trainer;

  @Column({ nullable: true, default: 0 })
  numberOfAttempts: number;

  @Column({ nullable: true })
  obtainMarks: number;

  @Column({ nullable: true })
  totalMarks: number;

  @Column({
    type: 'enum',
    enum: QuizStatusType,
    default: QuizStatusType.NOT_ATTEMPTED,
  })
  status: QuizStatusType;

  @OneToMany(() => QuizAttempts, (quizAttempts) => quizAttempts.submission)
  attempts: QuizAttempts[];

  @Column({ nullable: true })
  isPublish: boolean;
}
