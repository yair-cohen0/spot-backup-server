import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from 'cors';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsConfig: CorsOptions = {
    origin: 'http://127.0.0.1:8080',
    credentials: false,
    preftialightContinue: false,
  };

  app.enableCors(corsConfig);

  app.use(
    session({
      secret: 'NEST_SESSION',
      resave: false,
      saveUninitialized: false,
    }),
  );

  await app.listen(3000);
}

bootstrap();
