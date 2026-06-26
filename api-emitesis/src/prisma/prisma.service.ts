import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const NEON_CONNECT_RETRIES = 5;
const NEON_CONNECT_DELAY_MS = 3000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        for (let attempt = 1; attempt <= NEON_CONNECT_RETRIES; attempt++) {
            try {
                await this.$connect();
                return;
            } catch (err) {
                const isLast = attempt === NEON_CONNECT_RETRIES;
                const message = err instanceof Error ? err.message : String(err);
                if (isLast) {
                    throw err;
                }
                console.warn(
                    `[Prisma] No se pudo conectar a Neon (intento ${attempt}/${NEON_CONNECT_RETRIES}): ${message}. Reintentando en ${NEON_CONNECT_DELAY_MS / 1000}s...`,
                );
                await new Promise((resolve) => setTimeout(resolve, NEON_CONNECT_DELAY_MS));
            }
        }
    }
}
