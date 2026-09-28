import { HttpCode, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { ILike, Repository } from 'typeorm';
import { CoursesService } from '@courses/courses.service';
import ResponseHandler from '@utils/response.handler';
import { BlogCategory } from './entities/blog-category.entity';
import { CreateBlogCategoryDTO } from './dto/create-blog-category.dto';
import { BlogQueryDTO } from './dto/query-blog.dto';
import { BlogType } from '@utils/enum';
import HttpException from '@utils/exceptions/HttpException';
import { isUUID } from 'class-validator';
import { getDateAfterSkip } from '@utils/transformers/date.transformer';
import { SlugDto } from '@courses/interfaces/course.interface';
import { slugConversation } from '@utils/slugName';
import { Course } from '@courses/entities/course.entity';
import { QueryBlogCategoryDTO } from './dto/query-blog-category.dto';
import * as moment from 'moment';
import { UpdateBlogCategoryDTO } from './dto/update-blog-category.dto';

@Injectable()
export class BlogsService extends ResponseHandler {
  constructor(
    @InjectRepository(Blog) private blogRepository: Repository<Blog>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(BlogCategory)
    private blogCategoryRepo: Repository<BlogCategory>,
  ) {
    super();
  }

  // ---------------  Category APIs -------------------------

  /**
   *
   * Creates and return a new category
   *
   * @returns The newly created category
   *
   */
  async createCategory(createCategory: CreateBlogCategoryDTO) {
    const alreadyExists = await this.blogCategoryRepo.findOne({
      where: { name: ILike(`%${createCategory.name}%`) },
    });
    if (alreadyExists)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Already exists');
    const createdCategory = this.blogCategoryRepo.create(createCategory);
    return await this.blogCategoryRepo.save(createdCategory);
  }

  /**
   *
   * Returns all the categories saved in database
   *
   * @returns An array of categories
   *
   */

  async getCategory(payload: QueryBlogCategoryDTO) {
    const { blogType, web } = payload;
    if (web) {
      const categories = await this.blogCategoryRepo.find();
      const blogCountPromise = [];
      for (const item of categories) {
        const count = this.blogRepository.count({
          where: { blogCategory: { id: item.id }, blogType },
        });
        blogCountPromise.push(count);
      }
      const blogCount = await Promise.all(blogCountPromise);
      const blogCategories = [];
      for (let i = 0; i < blogCount.length; i++) {
        if (blogCount[i] > 0) {
          blogCategories.push(categories[i]);
        }
      }
      return blogCategories;
    }

    return await this.blogCategoryRepo.find({
      // where: {
      //   name: ILike(`%${payload.name}%`),
      // },
      order: { lastModifiedDate: 'DESC' },
    });
  }

  async updateBlogCategory(payload: UpdateBlogCategoryDTO, id: string) {
    const category = await this.blogCategoryRepo.findOne({ where: { id: id } });

    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');

    category.name = payload.name;

    return await this.blogCategoryRepo.save(category);
  }

  async removeBlogCategory(id: string) {
    const category = await this.blogCategoryRepo.findOne({ where: { id } });
    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid ID');
    const blogExists = await this.blogRepository.findOne({
      where: { blogCategory: { id: category.id } },
    });
    if (blogExists)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'This category has blogs added to it',
      );

    return await this.blogCategoryRepo.softDelete({ id: category.id });
  }

  // ---------------- Blogs APIs  --------------------------

  /**
   *
   * Creates and returns a new blog
   *
   * @returns The new blog
   *
   */
  async create(createBlogDto: CreateBlogDto): Promise<Blog> {
    const [category, alreadyExists] = await Promise.all([
      this.blogCategoryRepo.findOne({
        where: { id: createBlogDto.blogCategory },
      }),
      this.blogRepository.findOne({
        where: [
          { blogTitle: createBlogDto.blogTitle },
          { slugName: createBlogDto.slugName },
        ],
      }),
    ]);
    //  Throw exception if category doesn't exist
    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid category');

    //  Throw exception if blog already exists
    if (alreadyExists)
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'Duplicate blog title or slugname',
      );

    //  Creates blog from payload
    const createdBlog: Blog = this.blogRepository.create({
      ...createBlogDto,
      blogCategory: category,
    });

    return await this.blogRepository.save(createdBlog);
  }

  /**
   *
   * Returns all the blogs with pagination, total count, category wise count and also applies
   * search and filter
   *
   * @returns An array of blogs
   *
   */
  async findAll(query: BlogQueryDTO) {
    //  Checking for valid category id
    if (query.category && query.category !== '' && !isUUID(query.category))
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'category must be valid UUID',
      );

    // Gets all the properties from queryDTO
    const {
      limit = 6,
      page = 1,
      searchName = '',
      blogType,
      category,
      publishedDate,
      filterId,
    } = query;

    let startDate: Date;
    let endDate: Date;
    if (publishedDate) {
      startDate = moment(publishedDate).startOf('day').toDate();
      endDate = moment(publishedDate).endOf('day').toDate();
    }
    if (blogType == 'TUTORIAL') {
      const blogs = this.getBlogTutorialDetails();
      //  Getting type wise count of the blogs
      const article = this.blogRepository.count({
        where: { blogType: BlogType.Article },
      });
      const interview = this.blogRepository.count({
        where: { blogType: BlogType.Interview },
      });
      const tutorial = this.blogRepository.count({
        where: { blogType: BlogType.Tutorial },
      });
      const totalCount = this.blogRepository.count();
      //  Getting all the data asynchronously
      try {
        const [data, articleCount, interviewCount, tutorialCount, total] =
          await Promise.all([blogs, article, interview, tutorial, totalCount]);
        return { data, articleCount, interviewCount, tutorialCount, total };
      } catch (error) {
        throw new HttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Failed to fetch blog counts',
        );
      }
    }

    // Condition for limit=4 and page=1
    if (limit == 4 && page == 1) {
      const blogs = await this.getBlogDetails();
      //  Getting type wise count of the blogs
      const article = this.blogRepository.count({
        where: { blogType: BlogType.Article },
      });
      const interview = this.blogRepository.count({
        where: { blogType: BlogType.Interview },
      });
      const tutorial = this.blogRepository.count({
        where: { blogType: BlogType.Tutorial },
      });

      // Getting total blog count
      const totalCount = this.blogRepository.count();

      //  Getting all the data asynchronously
      const [data, articleCount, interviewCount, tutorialCount, total] =
        await Promise.all([blogs, article, interview, tutorial, totalCount]);

      return {
        data,
        articleCount,
        interviewCount,
        tutorialCount,
        totalCount: total,
      };
    } else if (blogType === BlogType.Article) {
      if (category) {
        const blogs = await this.getBlogDetails2(category);
        //  Getting type wise count of the blogs
        const article = this.blogRepository.count({
          where: { blogType: BlogType.Article },
        });
        const interview = this.blogRepository.count({
          where: { blogType: BlogType.Interview },
        });
        const tutorial = this.blogRepository.count({
          where: { blogType: BlogType.Tutorial },
        });

        // Getting total blog count
        const totalCount = this.blogRepository.count();

        //  Getting all the data asynchronously
        const [data, articleCount, interviewCount, tutorialCount, total] =
          await Promise.all([blogs, article, interview, tutorial, totalCount]);

        return {
          data,
          articleCount,
          interviewCount,
          tutorialCount,
          totalCount: total,
        };
      } else {
        const blogs = await this.getBlogDetails1();
        //  Getting type wise count of the blogs
        const article = this.blogRepository.count({
          where: { blogType: BlogType.Article },
        });
        const interview = this.blogRepository.count({
          where: { blogType: BlogType.Interview },
        });
        const tutorial = this.blogRepository.count({
          where: { blogType: BlogType.Tutorial },
        });

        // Getting total blog count
        const totalCount = this.blogRepository.count();

        //  Getting all the data asynchronously
        const [data, articleCount, interviewCount, tutorialCount, total] =
          await Promise.all([blogs, article, interview, tutorial, totalCount]);

        return {
          data,
          articleCount,
          interviewCount,
          tutorialCount,
          totalCount: total,
        };
      }
    } else {
      const [blogs, total] = await this.blogRepository
        .createQueryBuilder('blog')
        .innerJoinAndSelect('blog.blogCategory', 'category')
        .select([
          'blog.id',
          'blog.blogTitle',
          'blog.slugName',
          'blog.createdDate',
          'blog.lastModifiedDate',
          'blog.bannerImg',
          'blog.blogType',
          'category.id', // Alias 'category' to match the join
          'category.name',
        ])
        .where('blog.blogTitle ILIKE :search', { search: `%${searchName}%` })
        .andWhere(filterId ? 'blog.slugName <> :filterId' : '1=1', { filterId })
        .andWhere(blogType ? 'blog.blogType = :blogType' : '1=1', { blogType })
        .andWhere(category ? 'blog."blogCategoryId" = :category' : '1=1', {
          category,
        })
        .andWhere(
          publishedDate
            ? 'blog.lastModifiedDate BETWEEN :startDate AND :endDate'
            : '1=1',
          { startDate, endDate },
        )
        .orderBy('blog.lastModifiedDate', 'DESC')
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      // Fetch type-wise count of blogs
      const [articleCount, interviewCount, tutorialCount, totalCount] =
        await Promise.all([
          this.blogRepository.count({ where: { blogType: BlogType.Article } }),
          this.blogRepository.count({
            where: { blogType: BlogType.Interview },
          }),
          this.blogRepository.count({ where: { blogType: BlogType.Tutorial } }),
          total,
        ]);

      return {
        data: blogs,
        articleCount,
        interviewCount,
        tutorialCount,
        totalCount,
      };
    }
  }

  /**
   *
   * Get the details of a single blog by id
   *
   * @returns A single blog
   *
   */
  async findOne(slugDto: SlugDto): Promise<Blog> {
    //  Check if blogs exists else throw exception
    const filterObject: object = {};
    slugDto.id
      ? (filterObject['id'] = slugDto.id)
      : (filterObject['slugName'] = slugDto.name);
    const blog = await this.blogRepository.findOne({
      where: filterObject,
      relations: ['blogCategory'],
    });

    const categoryName = blog.blogCategory.name;
    const card = await this.courseRepo.findOne({
      where: { courseCategory: { name: categoryName } },
      relations: { trainingPlans: true },
    });

    blog['card'] = card;
    if (!blog) throw new HttpException(HttpStatus.NOT_FOUND, 'Blog not found');
    return blog;
  }

  /**
   *
   * Updates a blog based on id provided
   *
   * @returns The updated blog
   *
   */
  async update(id: string, updateBlogDto: UpdateBlogDto) {
    //  Checks if blogs exists else throws exception
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['blogCategory'],
    });
    if (!blog)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid blog id');

    //  Checks if category exists else throw exception
    const category = updateBlogDto.blogCategory
      ? await this.blogCategoryRepo.findOne({
          where: { id: updateBlogDto.blogCategory },
        })
      : blog.blogCategory;
    if (!category)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid category id');

    //Updates the blogs with paylaod values
    blog.authorName = updateBlogDto.authorName;
    blog.authorBio = updateBlogDto.authorBio;
    blog.bannerImg = updateBlogDto.bannerImg;
    blog.blogTitle = updateBlogDto.blogTitle;
    blog.content = updateBlogDto.content;
    blog.twitterId = updateBlogDto.twitterId;
    blog.linkedinId = updateBlogDto.linkedinId;
    blog.instagramId = updateBlogDto.instagramId;
    blog.blogType = updateBlogDto.blogType;
    blog.blogCategory = category;
    blog.tags = updateBlogDto.tags;
    blog.metaTags = updateBlogDto.metaTags;
    blog.metaTitle = updateBlogDto.metaTitle;
    blog.metaDescription = updateBlogDto.metaDescription;
    blog.slugName = updateBlogDto.slugName;

    //  Save and return blog
    return await this.blogRepository.save(blog);
  }

  /**
   *
   * Soft deletes a blog
   *
   */
  async remove(id: string) {
    //  Checks if blog exists else throw exception
    const blog = await this.blogRepository.findOne({ where: { id } });
    if (!blog)
      throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid Blog ID');
    return await this.blogRepository.softDelete({ id });
  }

  async getBlogTutorialDetails() {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .select([
        'blog.id',
        'blog.createdDate',
        'blog.blogTitle',
        'blog.slugName',
        'blog.bannerImg',
        'blog.blogType',
        'blog.lastModifiedDate',
      ])
      .where('blog.blogType = :type', { type: BlogType.Tutorial })
      .getMany(); // Use getOne() if you expect a single result
    return blogs;
  }
  // Return all the blogs on a particular value
  async getBlogDetails() {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.blogCategory', 'blogCategory')
      .select([
        'blog.id',
        'blog.blogTitle',
        'blog.slugName',
        'blog.createdDate',
        'blog.lastModifiedDate',
        'blog.bannerImg',
        'blog.blogType',
        'blogCategory.id',
        'blogCategory.name',
      ])
      .take(4) // Limit to 4 records
      .getMany();
    return blogs;
  }

  //Return all the blogs of a particular blog type
  async getBlogDetails1() {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.blogCategory', 'blogCategory')
      .select([
        'blog.id',
        'blog.blogTitle',
        'blog.bannerImg',
        'blog.slugName',
        'blog.createdDate',
        'blog.lastModifiedDate',
        'blog.blogType',
        'blogCategory.id',
        'blogCategory.name',
      ])
      .take(6) // Limit to 6 records
      .getMany();
    return blogs;
  }

  //Return all the blogs of a particular category
  async getBlogDetails2(category: string) {
    const blogs = await this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.blogCategory', 'blogCategory')
      .select([
        'blog.id',
        'blog.blogTitle',
        'blog.bannerImg',
        'blog.slugName',
        'blog.createdDate',
        'blog.lastModifiedDate',
        'blog.blogType',
        'blogCategory.id',
        'blogCategory.name',
      ])
      .where('blog."blogCategoryId" = :category', { category })
      .take(6) // Limit to 6 records
      .getMany();

    return blogs;
  }
}
