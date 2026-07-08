import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(documentId: string, userId: string, role: string, content: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { internship: true }
    });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (role !== 'COORDINADOR' && role !== 'ADMIN') {
      const isStudent = document.internship.studentId === userId;
      const isTutor = document.internship.tutorId === userId;
      if (!isStudent && !isTutor) {
        throw new ForbiddenException('No tienes permiso para comentar en este documento');
      }
    }
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

  async findByDocument(documentId: string, userId: string, role: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { internship: true }
    });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (role !== 'COORDINADOR' && role !== 'ADMIN') {
      const isStudent = document.internship.studentId === userId;
      const isTutor = document.internship.tutorId === userId;
      if (!isStudent && !isTutor) {
        throw new ForbiddenException('No tienes permiso para ver los comentarios de este documento');
      }
    }
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
