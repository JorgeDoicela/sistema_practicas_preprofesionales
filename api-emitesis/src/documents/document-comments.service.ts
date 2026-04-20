import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(documentId: string, userId: string, content: string) {
    return this.prisma.documentComment.create({
      data: {
        documentId,
        userId,
        content,
      },
      include: {
        user: {
          select: { fullName: true, role: true }
        }
      }
    });
  }

  async findByDocument(documentId: string) {
    return this.prisma.documentComment.findMany({
      where: { documentId },
      include: {
        user: {
          select: { fullName: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
