import { HttpStatus, Injectable } from '@nestjs/common';
import * as GoogleKeys from '../utils/google-key.json';
import { google } from 'googleapis';
import axios from 'axios';
import HttpException from '@utils/exceptions/HttpException';

@Injectable()
export class AnalyticsService {
  private reporting = google.analyticsreporting('v4');
  private scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
  private jwt = new google.auth.JWT({
    email: GoogleKeys.client_email,
    key: GoogleKeys.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });
  private propertyId = '366812364';
  private apiKey = 'AIzaSyBx0U2HIigZf_t-XavJ6B6co1EiD4tQ8Ec';
  constructor() {}

  async getViewerCount(): Promise<any> {
    try {
      const token = await this.jwt.authorize(); // Assuming this.jwt.authorizeAsync() returns a Promise
      const data = {
        dateRanges: [
          {
            startDate: 'today',
            endDate: 'today',
          },
        ],
        metrics: [
          {
            expression: 'totalUsers',
            name: 'active7DayUsers',
          },
        ],
      };

      const response = await axios.post(
        `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport?alt=json&key=${this.apiKey}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.access_token}`,
          },
        },
      );
      return response?.data?.rows[0]?.metricValues[0]?.value;
    } catch (error) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'something went wrong'); // Rethrow the error if needed
    }
  }
}
