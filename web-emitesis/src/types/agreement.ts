export interface Agreement {
  id: string;
  companyId: string;
  startDate: string;
  filePath: string;
  status: string;
  createdAt: string;
  company: {
    id: string;
    ruc: string;
    name: string;
    address: string;
    representative: string;
    email: string;
  };
}
