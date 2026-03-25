import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException, 
  Get,
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Agreements')
@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COORDINADOR) // Precondición: Administrador o Coordinador
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = process.env.VERCEL ? tmpdir() : './uploads/agreements';
          if (!process.env.VERCEL && !existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Regla de Negocio: Solo se aceptan archivos en formato PDF
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // Regla de Negocio: Tamaño máximo de 10 MB
      },
    }),
  )
  async create(
    @Body() createAgreementDto: CreateAgreementDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('El documento del convenio (PDF) es obligatorio');
    }
    
    // El path relativo para guardar en la BD
    const filePath = `/uploads/agreements/${file.filename}`;
    return this.agreementsService.create(createAgreementDto, filePath);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findAll() {
    return this.agreementsService.findAll();
  }
}
