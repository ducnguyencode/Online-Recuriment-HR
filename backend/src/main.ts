import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { TypeOrmExceptionFilter } from './common/typeorm-exception.filter';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { LoggerMiddleware } from './common/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpLogger = new LoggerMiddleware();
  app.use(httpLogger.use.bind(httpLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
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
