import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateForumDto } from './dto/create-forum.dto';
import { Forum } from './entities/forum.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CourseCategory } from '@courses/entities/course-category.entity';
import { Repository } from 'typeorm';
import HttpException from '@utils/exceptions/HttpException';
import { BatchEntity } from '@batch/entities/batch.entity';
import { Student } from '@students/entities/student.entity';
import { ForumListDTO } from './dto/forum-list.dto';
import { ForumComment } from './entities/forum-comment.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { Enrollment } from '@batch/entities/enrollment.entity';
import { AuthEntity } from '@auth/entities/auth.entity';
import { EditCommentDTO } from './dto/ecit-comment.dto';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(CourseCategory)
    private categoryRepo: Repository<CourseCategory>,
    @InjectRepository(BatchEntity) private batchRepo: Repository<BatchEntity>,
    @InjectRepository(Forum) private forumRepo: Repository<Forum>,
    @InjectRepository(ForumComment)
    private forumCommentRepo: Repository<ForumComment>,
    @InjectRepository(AuthEntity) private authRepo: Repository<AuthEntity>,
    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
  ) {}

  async getCategory() {
    const forumCategory = await this.categoryRepo.query(
      `select cc.id, cc."name", (select count(forum.id) from forum join "course-category" cc2 on forum."courseCategoryId" = cc2.id where cc.id = cc2.id) from "course-category" cc `,
    );

    const totalCount = await this.forumRepo.count();

    return { categories: forumCategory, totalCount };
  }

  async getAllBatch() {
    return await this.batchRepo.find({
      select: { id: true, batchId: true },
    });
  }

  async getMyBatch(id: string) {
    return await this.enrollmentRepo.find({
      where: { student: { auth: { id } } },
      relations: { batch: true },
      select: { id: true, batch: { id: true, batchId: true } },
    });
  }

  async create(createForumDto: CreateForumDto, id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id: createForumDto.categoryId },
    });

    //  Throw exception if category doesn't exist
    if (!category) throw new HttpException(404, `Course Category not found`);

    const forum = new Forum();
    if (!createForumDto.isGlobal) {
      const batch = await this.batchRepo.findOne({
        where: { id: createForumDto.batchId },
      });

      //  Throw exception if batch doesn't exist
      if (!batch) throw new HttpException(404, `Batch not found`);
      forum.batch = batch;
    }

    const student = await this.authRepo.findOne({
      where: { id },
    });

    if (!student) throw new HttpException(404, `Student not Found`);

    forum.courseCategory = category;
    forum.isGlobal = createForumDto.isGlobal;
    forum.auth = student;
    forum.title = createForumDto.title;
    forum.description = createForumDto.description;
    forum.createdBy = student.name || 'User';
    forum.lastModifiedBy = student.name || 'User';

    const saveForum = await this.forumRepo.save(forum);
    if (!saveForum) throw new HttpException(404, `Forum not created`);
    return saveForum;
  }

  async findAll(payload: ForumListDTO) {
    const forums = await this.forumRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.courseCategory', 'category')
      .leftJoin('qb.batch', 'batch')
      .leftJoinAndSelect('qb.auth', 'student')
      .where(payload.categoryName ? 'category.name ILIKE :category' : '1=1', {
        category: `%${payload.categoryName}%`,
      })
      .andWhere(payload.batchId ? 'batch.id = :batchId' : '1=1', {
        batchId: payload.batchId,
      })
      .leftJoinAndSelect('qb.forumComment', 'comment')
      .orderBy('qb.lastModifiedDate', 'DESC')
      .getMany();

    return forums;
  }

  async findOne(id: string) {
    return await this.forumRepo
      .createQueryBuilder('qb')
      .where('qb.id = :id', { id })
      .leftJoinAndSelect('qb.forumComment', 'comment')
      .leftJoinAndSelect('comment.commentBy', 'user')
      .orderBy('comment.lastModifiedDate', 'DESC')
      .getOne();
  }

  async findMyPost(id: string) {
    return await this.forumRepo
      .createQueryBuilder('qb')
      .leftJoin('qb.auth', 'auth')
      .where('auth.id = :id', { id })
      .leftJoinAndSelect('qb.forumComment', 'comment')
      .leftJoinAndSelect('comment.commentBy', 'user')
      .orderBy('qb.lastModifiedDate', 'DESC')
      .getMany();
  }

  async addComment(forumId: string, payload: AddCommentDto, id: string) {
    const forum = await this.forumRepo.findOne({ where: { id: forumId } });

    const student = await this.authRepo.findOne({
      where: { id },
    });

    if (!student) throw new HttpException(404, `Student not Found`);

    const comment = new ForumComment();

    comment.comment = payload.comment;
    comment.commentBy = student;
    comment.forum = forum;

    const savedComment = await this.forumCommentRepo.save(comment);

    if (!savedComment)
      throw new HttpException(404, `Comment not added on Post`);
    return savedComment;
  }

  async editComment(
    commentId: string,
    payload: EditCommentDTO,
    user: AuthEntity,
  ) {
    const comment = await this.forumCommentRepo.findOne({
      where: { id: commentId, commentBy: { id: user.id } },
    });
    if (!comment)
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'Unauthorized');
    comment.comment = payload.comment;

    await this.forumCommentRepo.save(comment);
  }

  async deleteComment(id: string, user: AuthEntity) {
    const comment = await this.forumCommentRepo.findOne({
      where: { id: id, commentBy: { id: user.id } },
    });
    if (!comment) throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Id');
    await this.forumCommentRepo.softDelete({ id: comment.id });
  }
}
