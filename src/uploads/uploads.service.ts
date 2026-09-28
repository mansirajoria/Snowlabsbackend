import {
  // GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
// import toStream = require('buffer-to-stream');
import * as AWS from 'aws-sdk';
const s3 = new AWS.S3();

@Injectable()
export class UploadsService {
  private readonly s3client = new S3Client({
    region: this.configService.getOrThrow('AWS_REGION'),
  });
  // private readonly cloudinaryConfig: any;
  private readonly bucket = process.env.AWS_BUCKET_NAME;

  constructor(private configService: ConfigService) {
    // this.cloudinaryConfig = this.configService.get('cloudinary');
  }

  async upload(
    filename: string,
    file: Buffer,
    module: string,
    useCDN: boolean = true,
  ) {
    const uploadKey = `${module}/${filename}`;
    const result = await this.s3client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: uploadKey, Body: file }),
    );

    if (result.$metadata.httpStatusCode === 200) {
      if (!useCDN)
        return `https://${this.bucket}.s3.${this.configService.get(
          'AWS_REGION',
        )}.amazonaws.com/${uploadKey}`;
      return `https://${this.configService.get('CDN_DOMAIN')}/${uploadKey}`;
    }
    throw new Error('Upload failed');
  }

  async uploadFileToS3(fileData: any, key: any): Promise<string> {
    const uploadParams = {
      Bucket: this.bucket,
      Key: key,
      Body: fileData,
      ContentType: 'video/mp4',
    };

    return new Promise((resolve, reject) => {
      s3.upload(uploadParams, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      });
    });
  }

  // async uploadImageToCloudinary(file: Express.Multer.File): Promise<string> {
  //   v2.config(this.cloudinaryConfig);
  //   return new Promise((resolve, reject) => {
  //     const upload = v2.uploader.upload_stream((error, result) => {
  //       if (error) return reject(error);
  //       resolve(result.secure_url);
  //     });
  //     toStream(file.buffer).pipe(upload);
  //   });
  // }

  async htmltoimage(name: any, content: any) {
    console.log('entering here');
    const uploadParams = {
      Bucket: this.bucket,
      Key: name,
      Body: content,
      ContentType: 'application/pdf',
    };

    return new Promise((resolve, reject) => {
      s3.upload(uploadParams, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}
