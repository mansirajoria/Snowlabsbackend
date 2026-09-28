import { registerAs } from '@nestjs/config';
import { PaymentConfig } from './config.interface';

export default registerAs<PaymentConfig>('payment', () => ({
  gst: process.env.GST,
  domesticCharges: process.env.DOMESTIC_CHARGES,
  internationalCharges: process.env.INTERNATIONAL_CHARGES,
  doller: process.env.DOLLER,
}));
