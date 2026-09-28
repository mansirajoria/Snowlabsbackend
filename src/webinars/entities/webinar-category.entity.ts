import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Webinar } from './webinar.entity';

@Entity('webinar-category')
export class WebinarCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Webinar, (webinar) => webinar.category)
  webinars: Webinar[];
}
