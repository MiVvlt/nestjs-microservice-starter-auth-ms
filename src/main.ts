import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {Logger} from '@nestjs/common';
import {ClientOptions, Transport} from '@nestjs/microservices';

const logger = new Logger('Main');
const microserviceOptions: ClientOptions = {
    transport: Transport.TCP,
    options: {
        host: '127.0.0.1',
        port: 3301
    }
};

async function bootstrap() {
    const app = await NestFactory.createMicroservice(AppModule, microserviceOptions);
    app.listen(() => {
        logger.log('Microservice is  listening');
    });
}

bootstrap();
