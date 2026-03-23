import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly appCfg: { nodeEnv: string },
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          errors = resObj.message;
        } else {
          message = resObj.message || message;
        }
      } else if (typeof res === 'string') {
        message = res;
      }
    }

    const body: Record<string, any> = {
      status: false,
      statusCode,
      message,
    };

    if (errors) {
      body.errors = errors;
    }

    if (
      this.appCfg.nodeEnv === 'development' &&
      exception instanceof Error
    ) {
      body.stack = exception.stack;
    }

    response.status(statusCode).json(body);
  }
}
