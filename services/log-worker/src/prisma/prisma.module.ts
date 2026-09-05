import { Global, Module } from '@nestjs/common';
import { LogPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [LogPrismaService],
  exports: [LogPrismaService],
})
export class LogPrismaModule {}
