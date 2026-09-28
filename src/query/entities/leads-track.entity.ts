import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Leads } from './leads.entity';
import { HelpDeskStatus, LeadsStatus } from '@utils/enum';

@Entity('leads-track')
export class LeadTrack {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => Leads, (lead) => lead.statusTrack)
  lead: Leads;

  @Column({ type: 'enum', enum: LeadsStatus, default: LeadsStatus.NEW })
  status: LeadsStatus;

  @Column({ nullable: true })
  comments: string;

  @CreateDateColumn()
  createdAt: string;
}
