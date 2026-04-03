import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, status);

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, status: number) {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode: status,
          message: response,
          error: exception.name,
          timestamp,
        };
      }

      if (typeof response === 'object' && response !== null) {
        const typedResponse = response as {
          message?: string | string[];
          error?: string;
        };

        const normalizedMessage = Array.isArray(typedResponse.message)
          ? typedResponse.message.join(', ')
          : typedResponse.message ?? this.getDefaultMessage(status);

        return {
          statusCode: status,
          message: normalizedMessage,
          error: typedResponse.error ?? exception.name,
          timestamp,
        };
      }
    }

    return {
      statusCode: status,
      message: this.getDefaultMessage(status),
      error: 'InternalServerError',
      timestamp,
    };
  }

  private getDefaultMessage(status: number) {
    if (status === HttpStatus.BAD_REQUEST) {
      return new BadRequestException().message;
    }

    return 'Internal server error';
  }
}
