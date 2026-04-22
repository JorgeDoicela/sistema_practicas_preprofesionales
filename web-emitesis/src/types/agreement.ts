export interface Agreement {
  id: string;
  companyId: string;
  startDate: string;
  endDate?: string;
  type?: string;
  maxInterns?: number;
  filePath: string;
  status: string;
  createdAt: string;
  company: {
    id: string;
    ruc: string;
    name: string;
    address: string;
    city?: string;
    representative: string;
    email: string;
    phone?: string;
    sector?: string;
  };
}
