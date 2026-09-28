import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { ResourceType } from '@utils/enum';
import { SessionEntity } from 'session/entities/session.entity';
import { AssignmentSubmission } from 'assignment-submission/entities/assignment-submission.entity';

@Entity('resource')
export class ResourceEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ResourceType,
    nullable: true,
  })
  resourceType: ResourceType;

  @Column()
  resourceName: string;

  @Column({ nullable: true })
  resourceFile: string;

  @Column({ nullable: true })
  resourceLink: string;

  @Column({ type: 'boolean', default: false })
  isPublish: boolean;

  @ManyToOne(() => SessionEntity, (sessionEntity) => sessionEntity.resources,{cascade:true})
  session: SessionEntity;

  @OneToMany(
    () => AssignmentSubmission,
    (assignmentSubmission) => assignmentSubmission.assignment,
  )
  assignmentSubmission: AssignmentSubmission[];

  @Column({ nullable: true })
  dueDate: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
