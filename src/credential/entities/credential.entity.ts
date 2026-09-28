import { BaseEntity } from '@utils/base.entity';
import { Column, DeleteDateColumn, Entity } from 'typeorm';

@Entity('credential')
export class CredentialEntity extends BaseEntity {
  @Column()
  outLookToken: string;

  @Column()
  outLookRefreshToken: string;

  @Column({ nullable: true })
  type: string;

  @Column('float', { nullable: true })
  value: number;

  @DeleteDateColumn()
  deletedAt: Date;
}
