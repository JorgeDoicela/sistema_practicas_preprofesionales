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
    const rolesDistribution = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

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
    // Retorna una serie de tiempo (últimas 24 horas) para gráficos
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const logs = await this.prisma.systemLog.findMany({
      where: { createdAt: { gte: last24h } },
      select: { createdAt: true, level: true, durationMs: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por hora
    const series = {};
    logs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      if (!series[hour]) series[hour] = { hour, total: 0, errors: 0, sumDuration: 0, countDuration: 0 };
      series[hour].total++;
      if (log.level === 'ERROR') series[hour].errors++;
      if (log.durationMs) {
        series[hour].sumDuration += log.durationMs;
        series[hour].countDuration++;
      }
    });

    return Object.values(series).map((s: any) => ({
      hour: `${s.hour}:00`,
      total: s.total,
      errors: s.errors,
      avgLatency: s.countDuration > 0 ? Number((s.sumDuration / s.countDuration).toFixed(2)) : 0,
    }));
  }
}
