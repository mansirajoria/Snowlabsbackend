import { Column, Entity, DeleteDateColumn, ManyToOne, BeforeInsert, getRepository, Generated } from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { MockTest } from './mock-test.entity';

@Entity('mock-test-questions')
export class MockTestQuestionEntity extends BaseEntity {
  @Column()
  question: string;

  @ManyToOne(() => MockTest, (mockTest) => mockTest.questions)
  mockTest: MockTest;

  @Column('jsonb')
  options: { id: number; text: string }[];

  @Column()
  correctAnswer: number;

  @Column()
  questionNo:number

  @DeleteDateColumn()
  deletedAt: Date;


}
