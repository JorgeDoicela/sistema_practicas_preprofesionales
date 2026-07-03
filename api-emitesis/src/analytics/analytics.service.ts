import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalInternships, totalAgreements, logsToday, errorsToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.internship.count(),
      this.prisma.agreement.count(),
      this.prisma.systemLog.count({ where: { createdAt: { gte: today } } }),
      this.prisma.systemLog.count({ where: { level: 'ERROR', createdAt: { gte: today } } }),
    ]);

    // Obtener distribución de roles
    const rolesDistributionRaw = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    const rolesDistribution = rolesDistributionRaw.map((item) => ({
      role: item.role,
      _count: item._count.id,
    }));

    // Obtener promedio de tiempo de respuesta (últimos 1000 logs)
    const recentLogs = await this.prisma.systemLog.findMany({
      where: { durationMs: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { durationMs: true },
    });
    
    const avgResponseTime = recentLogs.length > 0 
      ? recentLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / recentLogs.length
      : 0;

    return {
      counters: {
        totalUsers,
        totalInternships,
        totalAgreements,
        logsToday,
        errorsToday,
      },
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      rolesDistribution,
    };
  }

  async getSystemHealthSeries() {
    // Retorna una serie de tiempo (últimas 24 horas) para gráficos en orden cronológico
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const logs = await this.prisma.systemLog.findMany({
      where: { createdAt: { gte: last24h } },
      select: { createdAt: true, level: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    });

    // Inicializar los 24 intervalos cronológicamente de forma consecutiva
    const seriesList: any[] = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(last24h.getTime() + (i + 1) * 60 * 60 * 1000);
      const h = d.getHours();
      seriesList.push({
        hour: `${h}:00`,
        total: 0,
        errors: 0,
        sumDuration: 0,
        countDuration: 0,
      });
    }

    logs.forEach(log => {
      const logDate = new Date(log.createdAt);
      // Mapear cada log al intervalo correspondiente
      const diffMs = logDate.getTime() - last24h.getTime();
      const slotIndex = Math.floor(diffMs / (60 * 60 * 1000));
      if (slotIndex >= 0 && slotIndex < 24) {
        const s = seriesList[slotIndex];
        s.total++;
        if (log.level === 'ERROR') s.errors++;
        if (log.durationMs) {
          s.sumDuration += log.durationMs;
          s.countDuration++;
        }
      }
    });

    return seriesList.map(s => ({
      hour: s.hour,
      total: s.total,
      errors: s.errors,
      avgLatency: s.countDuration > 0 ? Number((s.sumDuration / s.countDuration).toFixed(2)) : 0,
    }));
  }
}
