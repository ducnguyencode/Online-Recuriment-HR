/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { TypeOrmExceptionFilter } from './common/api-response-format/typeorm-exception.filter';
import { HttpExceptionFilter } from './common/api-response-format/http-exception.filter';
import { CleanInputPipe } from './helper/clean-input-pipe';
import { capitalize } from './helper/function.helper';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new CleanInputPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const getFirstError = (errs: any[]): string => {
          for (const err of errs) {
            if (err.constraints) {
              return Object.values(err.constraints)[0] as string;
            }
            if (err.children?.length) {
              const childError = getFirstError(err.children);
              if (childError) return childError;
            }
          }
          return 'Validation error';
        };

        return {
          statusCode: 400,
          message: capitalize(getFirstError(errors)),
          data: null,
        };
      },
    }),
  );
  app.enableCors({
    origin: 'http://localhost:4200', // Angular
    credentials: true,
  });
  app.useGlobalFilters(new TypeOrmExceptionFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    index: false,
    prefix: '/uploads',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
