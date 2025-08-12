import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://43.216.59.45',
      'https://tanweihup.dev',
      'http://tanweihup.dev'
    ],
    methods: ['GET'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
