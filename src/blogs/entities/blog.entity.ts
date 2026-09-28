import { BaseEntity } from '@utils/base.entity';
import { Column, DeleteDateColumn, Entity, Index, ManyToOne } from 'typeorm';
import { BlogCategory } from './blog-category.entity';
import { BlogType } from '@utils/enum';
import { Exclude } from 'class-transformer';

@Entity('blog')
export class Blog extends BaseEntity {
  @Column()
  authorName: string;

  @Index()
  @Column()
  blogTitle: string;

  @Index()
  @Column({ nullable: true })
  slugName: string;

  @Column()
  bannerImg: string;

  @Column('text', { array: true })
  topicsCovered: string[];

  @Column({ type: 'json', array: false })
  content: Array<{
    heading: string;
    text: string;
    image: string;
    caption: string;
  }>;

  @ManyToOne(() => BlogCategory)
  blogCategory: BlogCategory;

  @Column({ type: 'enum', enum: BlogType })
  blogType: BlogType;

  @Column({ nullable: true })
  authorBio?: string;

  @Column({ nullable: true })
  twitterId?: string;

  @Column({ nullable: true })
  instagramId?: string;

  @Column({ nullable: true })
  linkedinId?: string;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true })
  metaDescription: string;

  @Column({ nullable: true })
  metaTags: string;
}
