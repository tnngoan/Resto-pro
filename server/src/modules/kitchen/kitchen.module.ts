import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { KitchenGateway } from './kitchen.gateway';
import { PrismaModule } from '@/common/prisma/prisma.module';
import Redis from 'ioredis';

const logger = new Logger('KitchenModule');

/**
 * Factory that creates a Redis client from REDIS_URL.
 * Returns `null` when no URL is configured — the gateway will
 * fall back to the default in-memory adapter (fine for local dev).
 */
async function createRedisClient(
  configService: ConfigService,
  label: string,
): Promise<Redis | null> {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (!redisUrl) {
    logger.warn(`REDIS_URL not set — ${label} client will not be created`);
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      // Upstash requires TLS; ioredis auto-detects from rediss:// scheme
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: false,
    });

    client.on('error', (err) => {
      logger.error(`Redis ${label} client error: ${err.message}`);
    });

    client.on('connect', () => {
      logger.log(`Redis ${label} client connected`);
    });

    return client;
  } catch (err: any) {
    logger.error(`Failed to create Redis ${label} client: ${err.message}`);
    return null;
  }
}

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    KitchenService,
    KitchenGateway,
    {
      provide: 'REDIS_PUB_CLIENT',
      useFactory: (configService: ConfigService) =>
        createRedisClient(configService, 'PUB'),
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUB_CLIENT',
      useFactory: (configService: ConfigService) =>
        createRedisClient(configService, 'SUB'),
      inject: [ConfigService],
    },
  ],
  controllers: [KitchenController],
  exports: [KitchenGateway], // Exported so OrdersService, TablesService, InventoryService can emit events
})
export class KitchenModule {}
