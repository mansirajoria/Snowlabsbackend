import { HttpStatus, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import HttpException from '@utils/exceptions/HttpException';

@Injectable()
export class AnalyticsService {
  private reporting = google.analyticsreporting('v4');
  private scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
  private propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '366812364';
  private apiKey = process.env.GOOGLE_ANALYTICS_API_KEY;
  constructor() {}

  async getViewerCount(): Promise<any> {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!serviceAccountEmail || !serviceAccountPrivateKey || !this.apiKey) {
      throw new HttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Google Analytics credentials are not configured',
      );
    }

    try {
      const jwt = new google.auth.JWT({
        email: serviceAccountEmail,
        key: serviceAccountPrivateKey.replace(/\\n/g, '\n'),
        scopes: this.scopes,
      });
      const token = await jwt.authorize();
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
