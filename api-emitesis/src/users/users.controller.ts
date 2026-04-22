import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { TwoFactorGuard } from '../auth/strategies/two-factor.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersBulkService } from './users-bulk.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersBulkService: UsersBulkService,
  ) {}

  @Post('bulk-import')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('No se ha proporcionado ningún archivo');
    return this.usersBulkService.importFromExcel(file.buffer, req.user.userId);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto, @Req() req: { user: { userId: string } }) {
    const currentUserId = req.user.userId;
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('me')
  @Roles(
    Role.ADMIN,
    Role.COORDINADOR,
    Role.TUTOR,
    Role.TUTOR_EMPRESARIAL,
    Role.ESTUDIANTE,
    Role.EMPRESA,
  )
  findMe(@Req() req: { user: { userId: string } }) {
    return this.usersService.findProfile(req.user.userId);
  }

  @Patch('me')
  @Roles(
    Role.ADMIN,
    Role.COORDINADOR,
    Role.TUTOR,
    Role.TUTOR_EMPRESARIAL,
    Role.ESTUDIANTE,
    Role.EMPRESA,
  )
  updateMe(
    @Req() req: { user: { userId: string } },
    @Body() body: { fullName?: string; password?: string },
  ) {
    const allowed: { fullName?: string; password?: string } = {};
    if (body.fullName?.trim()) allowed.fullName = body.fullName.trim();
    if (body.password?.trim()) allowed.password = body.password.trim();
    return this.usersService.update(req.user.userId, allowed, req.user.userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: { userId: string } },
  ) {
    const currentUserId = req.user.userId;
    return this.usersService.update(id, updateUserDto, currentUserId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(TwoFactorGuard)
  remove(@Param('id') id: string, @Req() req: { user: { userId: string } }) {
    const currentUserId = req.user.userId;
    return this.usersService.remove(id, currentUserId);
  }
}
