import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@utils/base.entity';
import { MockTestCategory } from './mock-test-category.entity';
import { MockTestQuestionEntity } from './mock-test-question.entity';

@Entity('mock-test')
@Index('mocktest_name_unique', ['name'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
@Index('mock_slugName_unique', ['slugName'], {
  unique: true,
  where: '("deletedAt" IS NULL)',
})
export class MockTest extends BaseEntity {
  @Column()
  name: string;

  @Column()
  slugName: string;

  @ManyToOne(
    () => MockTestCategory,
    (mockTestCategoryEntity) => mockTestCategoryEntity.id,
  )
  mockTestCategory: MockTestCategory;

  @Column({ name: 'img', nullable: false })
  image: string;

  @Column({ name: 'description', nullable: false })
  description: string;

  @OneToMany(
    () => MockTestQuestionEntity,
    (mockTestQuestion) => mockTestQuestion.mockTest,
  )
  questions: MockTestQuestionEntity[];

  @Column({ nullable: true })
  numberOfQuestions: number;

  @Column({ nullable: true, type: 'float' })
  duration: number;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ nullable: true })
  metaTags: string;

  @Column({ default: 0 })
  answerCount: number;
}
