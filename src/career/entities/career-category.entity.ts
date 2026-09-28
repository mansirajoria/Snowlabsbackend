import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Career } from '@career/entities/career.entity';

@Entity('career-category')
export class CareerCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: false, unique: true })
  name: string;

  @Column({ name: 'description', nullable: false })
  description: string;

  @OneToMany(() => Career, (careerEntity) => careerEntity.careerCategory)
  career: Career[];
}
