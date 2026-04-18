import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { SettingsService } from '../settings/settings.service';

describe('AttendanceService (Geofencing)', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: StorageService,
          useValue: {},
        },
        {
          provide: SettingsService,
          useValue: {
            getNumberValue: jest.fn().mockResolvedValue(250),
          },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('calculateDistance', () => {
    it('should calculate the distance between two points correctly (Quito - Guayaquil ~270km)', () => {
      const quito = { lat: -0.1807, lng: -78.4678 };
      const guayaquil = { lat: -2.1894, lng: -79.8890 };
      
      // Accedemos al método privado mediante cast a any para testeo unitario
      const distance = (service as any).calculateDistance(
        quito.lat, quito.lng,
        guayaquil.lat, guayaquil.lng
      );
      
      // La distancia real es aprox 268-272km
      expect(distance).toBeGreaterThan(265);
      expect(distance).toBeLessThan(275);
    });

    it('should calculate small distances correctly (200m)', () => {
      const pointA = { lat: -0.1807, lng: -78.4678 };
      // Desplazamiento de ~0.0018 grados es aprox 200m
      const pointB = { lat: -0.1807, lng: -78.4660 };
      
      const distance = (service as any).calculateDistance(
        pointB.lat, pointB.lng,
        pointA.lat, pointA.lng
      );
      
      const distanceInMeters = distance * 1000;
      expect(distanceInMeters).toBeGreaterThan(150);
      expect(distanceInMeters).toBeLessThan(250);
    });

    it('should return 0 for the same point', () => {
      const lat = -0.1807;
      const lng = -78.4678;
      const distance = (service as any).calculateDistance(lat, lng, lat, lng);
      expect(distance).toBe(0);
    });
  });
});
