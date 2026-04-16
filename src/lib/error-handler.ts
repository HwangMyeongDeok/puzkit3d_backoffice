import { toast } from "sonner";
import { AxiosError } from "axios";

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

// Type Guard để check RTK Query format
function isFetchBaseQueryError(error: unknown): error is { data: ProblemDetails } {
  return typeof error === "object" && error !== null && "data" in error;
}

// Trích xuất error message ở dạng chuỗi (dùng cho toast.promise)
export const extractErrorMessage = (
  error: unknown,
  fallbackMessage = "Có lỗi xảy ra, vui lòng thử lại!"
): string => {
  let problemData: ProblemDetails | undefined = undefined;

  // Hỗ trợ cả RTK Query (error.data) và Axios (error.response?.data)
  if (isFetchBaseQueryError(error)) {
    problemData = error.data;
  } else if (error instanceof AxiosError && error.response?.data) {
    problemData = error.response.data as ProblemDetails;
  } else if (typeof error === "object" && error !== null && "response" in error) {
    // Trường hợp custom error axios
    problemData = (error as any).response?.data as ProblemDetails;
  }

  if (problemData) {
    // Ưu tiên 1: Lỗi Validate form list array
    if (problemData.errors && Object.keys(problemData.errors).length > 0) {
      const firstErrorField = Object.values(problemData.errors)[0];
      if (firstErrorField && firstErrorField.length > 0) {
        return firstErrorField[0];
      }
    }

    // Ưu tiên 2 & 3: Lỗi detail hoặc title
    if (problemData.detail) {
      return problemData.detail;
    }

    if (problemData.title) {
      return problemData.title;
    }
  }

  // Xử lý message string cơ bản (trường hợp backend chỉ trả về object {message: "..."})
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
     if ((error as any).response?.data?.message) {
         return (error as any).response.data.message;
     }
  }

  return fallbackMessage;
};

// Hàm bắn toast độc lập (dùng cho try/catch manual)
export const handleErrorToast = (
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again!"
): void => {
  const errorMessage = extractErrorMessage(error, fallbackMessage);
  toast.error(errorMessage);
};
