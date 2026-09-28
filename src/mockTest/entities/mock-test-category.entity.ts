import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MockTest } from './mock-test.entity';

@Entity('mock-test-category')
export class MockTestCategory {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  name: string;

  @OneToMany(() => MockTest, (mockTestEntity) => mockTestEntity.id)
  mockTest: MockTest[];
}
