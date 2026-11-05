import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { google } from 'googleapis';
import HttpException from '@utils/exceptions/HttpException';

@Injectable()
export class AnalyticsService {
  private readonly scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
  ];
  private readonly propertyId =
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID || '366812364';

  async getViewerCount(): Promise<string | undefined> {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!email || !privateKey) {
      throw new HttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Google Analytics credentials are not configured',
      );
    }

    const jwt = new google.auth.JWT({
      email,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: this.scopes,
    });
    const { access_token: accessToken } = await jwt.authorize();

    if (!accessToken) {
      throw new HttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Google Analytics authorization failed',
      );
    }

    const response = await axios.post<{
      rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
    }>(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [{ name: 'active7DayUsers', expression: 'totalUsers' }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data.rows?.[0]?.metricValues?.[0]?.value;
  }
}
