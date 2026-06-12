import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Bridge Relayer API')
    .setDescription(
      'The API documentation for the cross-chain bridge relayer (Ethereum Sepolia <-> Polygon Amoy).',
    )
    .setVersion('1.0')
    .addTag('bridge')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Bridge Relayer service is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/swagger`);
}
bootstrap();
