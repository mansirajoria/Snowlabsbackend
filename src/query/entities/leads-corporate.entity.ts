import { BaseEntity } from '@utils/base.entity';
import { CorporateLeadCategory, LeadsStatus } from '@utils/enum';
import { Entity, Column, OneToMany } from 'typeorm';
import { CorporateTrack } from './leads-corporate-track.entity';

@Entity('lead-corporate')
export class CorporateLead extends BaseEntity {
  @Column({ nullable: true })
  name: string;

  @Column()
  query: string;

  @Column()
  queryId: string;

  @Column({ default: LeadsStatus.NEW })
  status: LeadsStatus;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  organization: string;

  @Column()
  contactNo: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: CorporateLeadCategory })
  category: CorporateLeadCategory;

  @Column({ default: false })
  isOpened: boolean;

  @OneToMany(() => CorporateTrack, (track) => track.lead)
  statusTrack: CorporateTrack[];
}
