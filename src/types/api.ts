// Monitoring Types
export enum NozzleStatus {
  NotConfigured = 0,  // No hardware assigned
  Available = 1,      // L - Libre: nozzle at rest, ready
  Blocked = 2,        // B - Bloqueado: requires software authorization
  Fueling = 3,        // A - Abasteciendo: flow detected, totalizers active
  Ready = 4,          // P - Pronto: nozzle lifted, waiting authorization
  Waiting = 5,        // E - Espera: handshake or Identfid validation
  Failure = 6,        // F - Falla: ICOM communication error
  Busy = 7,           // # - Ocupado: another nozzle on same pump side is active
  Error = 8           // ! - Error genérico
}

export interface NozzleStatusDto {
  nozzleCode: string;  // "01", "02", etc.
  status: NozzleStatus;
  statusName: string;  // "Libre", "Bloqueado", etc.
}

export interface VisualizationDto {
  nozzleCode: string;
  currentLiters: number;
  productName: string | null;
  status: NozzleStatus;
}

// Fueling Transaction Types
export interface FuelingTransactionDto {
  id: string;
  totalCash: number;
  totalLiters: number;
  unitPrice: number;
  duration: string;
  channel: string;
  transactionDate: string;
  registerNumber: number;
  openingTotalizer: number | null;
  closingTotalizer: number;
  integrityOk: boolean;
  checksumOk: boolean;
  nozzleCode: string | null;
  nozzleNumber: number | null;
  tankNumber: number | null;
  fuelCode: string | null;
  tag1: string | null;
  tag2: string | null;
  // Related entities
  productName: string | null;
  attendantName: string | null;
  attendantCode: string | null;
}

// API Response wrapper
export interface Result<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
}

// Auth Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiry: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Attendant Types
export interface AttendantDto {
  id: string;
  code: string;
  fullName: string;
  identificationNumber: string | null;
  hireDate: string | null;
  tagId: string | null;
  protocolUserLevel: string | null;
  isActive: boolean;
  phone: string | null;
  email: string | null;
  notes: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAttendantRequest {
  code: string;
  fullName: string;
  identificationNumber?: string;
  hireDate?: string;
  tagId?: string;
  protocolUserLevel?: string;
  isActive: boolean;
  phone?: string;
  email?: string;
  notes?: string;
  userId?: string;
}

export interface UpdateAttendantRequest extends CreateAttendantRequest {
  id: string;
}

// Price Types
export interface ProductPriceDto {
  productId: string;
  productCode: string;
  productName: string;
  currentPrice: number;
  priceDecimals: number;
  isActive: boolean;
}

export interface PriceHistoryDto {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
  reason: string | null;
  notes: string | null;
}

export interface UpdatePriceRequest {
  newPrice: number;
  changedBy: string;
  reason?: string;
  notes?: string;
}

// Product Types
export interface ProductDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceDecimals: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  priceDecimals: number;
  currentPrice: number;
  isActive: boolean;
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: string;
}

// User Types (Sistema)
export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Operator' | 'ReadOnly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  lastLogin: string | null;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: 'Admin' | 'Operator' | 'ReadOnly';
  isActive: boolean;
}

export interface UpdateUserRequest {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Operator' | 'ReadOnly';
  isActive: boolean;
  password?: string; // Opcional, solo si se quiere cambiar
}
