import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Leads } from './leads.entity';
import { HelpDeskStatus, LeadsStatus } from '@utils/enum';
import { Helpdesk } from './helpdesk.entity';

@Entity('helpdesk-track')
export class HelpdeskTrack {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => Helpdesk, (hd) => hd.statusTrack)
  helpdesk: Helpdesk;

  @Column({ type: 'enum', enum: HelpDeskStatus, default: HelpDeskStatus.NEW })
  status: HelpDeskStatus;

  @Column({ nullable: true })
  comments: string;

  @CreateDateColumn()
  createdAt: string;
}
