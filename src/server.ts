import { Server } from 'http';
import app from './app';
import config from './config';
import prisma from './shared/prisma';

let server: Server;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log(`🛢️  Database is connected successfully`);

    server = app.listen(config.port, () => {
      console.log(`🚀 Application listening on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to connect database', err);
  }

  process.on('unhandledRejection', (error) => {
    if (server) {
      server.close(() => {
        console.error('Unhandled Rejection detected', error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

bootstrap();

process.on('uncaughtException', () => {
  console.log('Uncaught Exception detected ......');
  process.exit(1);
});
