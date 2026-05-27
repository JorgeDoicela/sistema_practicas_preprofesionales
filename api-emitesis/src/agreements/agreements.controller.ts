import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException, 
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
 
interface MulterFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}


@ApiTags('Agreements')
@Controller('agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post()
  @Roles(Role.COORDINADOR) // Solo el Coordinador gestiona convenios
  @UseInterceptors(
    FileInterceptor('file', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      storage: diskStorage({
        destination: (req, file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
          const uploadPath = './uploads/agreements';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => {
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
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('El documento del convenio (PDF) es obligatorio');
    }
    
    // El path relativo para guardar en la BD
    const filePath = `/uploads/agreements/${file.filename}`;
    return this.agreementsService.create(createAgreementDto, filePath);
  }

  @Get()
  @Roles(Role.COORDINADOR)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.agreementsService.findAll(page, limit);
  }
}
