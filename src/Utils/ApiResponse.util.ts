export interface ApiResponse<T = any> {
  message: string;
  success: boolean;
  status: number;
  data?: T;
  count?: number;
}

export const sendSuccessResponse = <T>(
  message: string,
  status: number = 200,
  data?: T,
  count?: number
): ApiResponse<T> => {
  return {
    message,
    success: true,
    status,
    ...(data != null && { data }),
    ...(count != null && count !== 0 && !Number.isNaN(count) && { count })
  };
};

export const sendErrorResponse = (
  message: string,
  status: number = 400
): ApiResponse => {
  return {
    message,
    success: false,
    status
  };
};
