import { Student } from '@students/entities/student.entity';
import { Trainer } from '@trainer/entities/trainer.entity';
import { BaseEntity } from '@utils/base.entity';
import { AssignmentEnum } from '@utils/enum';
import { ResourceEntity } from 'resources/entities/create-resource.entity';
import { SessionEntity } from 'session/entities/session.entity';
import { Column, ManyToOne, OneToMany } from 'typeorm';
import { Entity } from 'typeorm/decorator/entity/Entity';

@Entity('assignment-submissions')
export class AssignmentSubmission extends BaseEntity {
  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.resources,{cascade:true})
  session: SessionEntity;

  @ManyToOne(
    () => ResourceEntity,
    (resourceEntity) => resourceEntity.assignmentSubmission,
  )
  assignment: ResourceEntity;

  @ManyToOne(() => Student, (student) => student.id, { nullable: true })
  student: Student;

  @ManyToOne(() => Trainer, (trainer) => trainer.id, { nullable: true })
  trainer: Trainer;

  @Column({
    type: 'enum',
    enum: AssignmentEnum,
    default: AssignmentEnum.PENDING,
  })
  status: AssignmentEnum;

  @Column({ nullable: true })
  obtainMarks: number;

  @Column({ nullable: true,default:10 })
  totalMarks: number;

  @Column({ default: false })
  isEvaluated?: boolean;

  @Column({ nullable: true })
  feedBack?: string;

  @Column({ nullable: true })
  submissionLink: string;

  @Column({ nullable: true })
  submissionDate: Date;

  @Column({ nullable: true })
  evaluationDate: Date;

  @Column({ nullable: true })
  isPassed: boolean;

  @Column({ nullable: true })
  isPublish: boolean;
}
