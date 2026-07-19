export interface ApiResponse<T> {
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export interface ApiError {
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}
