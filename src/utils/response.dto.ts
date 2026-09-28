import { ApiProperty } from '@nestjs/swagger';

/**
 * A response object.
 */
export class ResponseDTO {
  @ApiProperty({
    description: "Success status of the response, 'true' for success response",
    required: true,
  })
  success: boolean;

  @ApiProperty({ description: 'response payload', required: true })
  payload: any;

  @ApiProperty({ description: 'response message', required: false })
  message?: string;

  @ApiProperty({ description: 'status code', required: false })
  statusCode?: number;
}
