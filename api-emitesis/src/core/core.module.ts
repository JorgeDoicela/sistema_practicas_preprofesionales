import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { SignatureService } from './signature.service';
import { BridgeService } from './bridge.service';

@Global()
@Module({
  imports: [PrismaModule, SystemLogsModule],
  providers: [SignatureService, BridgeService],
  exports: [SignatureService, BridgeService],
})
export class CoreModule {}
