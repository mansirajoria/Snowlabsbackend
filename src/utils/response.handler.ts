export class ResponseHandler {
  sendSuccessResponse = (payload: any, message: string, statusCode?: any) => ({
    success: true,
    payload,
    message,
    statusCode: statusCode ? statusCode : 200,
  });

  sendFailedResponse = (payload: any, message: string, statusCode?: any) => {
    console.log(payload);
    return {
      success: false,
      payload,
      message,
      statusCode: statusCode ? statusCode : 400,
    };
  };
}

export default ResponseHandler;
