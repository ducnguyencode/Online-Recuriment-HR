/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

import { QueryFailedError } from 'typeorm';
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const error = exception.driverError;

    let message = 'Database error';

    // ✅ Unique violation
    if (error?.code === '23505') {
      const match = error.detail?.match(/\((.*?)\)=\((.*?)\)/) as string[];

      if (match) {
        const matchFields = match?.[1]
          .split(',')
          .map((f) => f.replace(/"/g, '').trim());
        const matchValues = match?.[2].split(',').map((v) => v.trim());
        if (matchFields[1]) {
          message = `${this.capitalize(matchFields[0])} "${matchValues[0]}" already exists in ${matchFields[1].slice(0, -2)}`;
        } else {
          message = `${this.capitalize(matchFields[0])} "${matchValues[0]}" already exists`;
        }
      }
    }

    // ✅ Foreign key violation
    else if (error?.code === '23503') {
      message = 'Related record does not exist';
    }

    // fallback
    else if (error?.message) {
      message = error.message;
    }

    return response.status(400).json({
      statusCode: 400,
      message,
      data: null,
    });
  }

  private capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
