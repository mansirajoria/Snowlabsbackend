import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @CreateDateColumn({ nullable: true })
  createdDate?: Date;

  @UpdateDateColumn({ nullable: true })
  lastModifiedDate?: Date;
}
