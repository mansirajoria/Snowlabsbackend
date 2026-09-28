import { BaseEntity } from '@utils/base.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('blog-category')
export class BlogCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @DeleteDateColumn()
  deletedAt?: Date;
}
