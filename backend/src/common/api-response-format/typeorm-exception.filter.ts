/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
const constraintMessages: Record<string, string> = {
  UQ_vacancy_title_department: 'Vacancy title already exists in deparment',
  UQ_applicant_vacancy: 'Applicant already applied to this vacancy',
  UQ_user_email: 'User email already exists',
  UQ_department_name: 'Department title already exists',
};
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const error = exception.driverError;

    const message = constraintMessages[error.constraint] || error.message;

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
