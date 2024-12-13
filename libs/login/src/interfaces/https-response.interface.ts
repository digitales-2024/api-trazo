export interface HttpResponse<T = null> {
  statusCode: number;
  message: string;
  data: T;
}
