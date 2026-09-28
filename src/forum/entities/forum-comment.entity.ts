import { BaseEntity } from '@utils/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Forum } from './forum.entity';
import { AuthEntity } from '@auth/entities/auth.entity';

@Entity('forum-comment')
export class ForumComment extends BaseEntity {
  @ManyToOne(() => Forum, (forum) => forum.forumComment)
  forum: Forum;

  @Column()
  comment: string;

  @ManyToOne(() => AuthEntity)
  commentBy: AuthEntity;
}
