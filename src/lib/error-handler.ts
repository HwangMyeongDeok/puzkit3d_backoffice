import { toast } from "sonner";

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

interface GenericError {
  response?: {
    data?: ProblemDetails;
  };
  data?: ProblemDetails;
  message?: string;
}

export const extractErrorMessage = (
  error: unknown,
  fallbackMessage = "Có lỗi xảy ra, vui lòng thử lại!"
): string => {
  const errObj = error as GenericError;
  if (!errObj) return fallbackMessage;

  const problemData = errObj.response?.data || errObj.data;

  if (problemData) {
    if (problemData.errors && Object.keys(problemData.errors).length > 0) {
      const firstErrorField = Object.values(problemData.errors)[0];
      if (firstErrorField && firstErrorField.length > 0) {
        return firstErrorField[0];
      }
    }

    if (problemData.detail) {
      return problemData.detail;
    }

    if (problemData.message) {
      return problemData.message;
    }
    if (problemData.title) {
      return problemData.title;
    }
  }

  if (errObj.message) {
    return errObj.message;
  }

  return fallbackMessage;
};

export const handleErrorToast = (
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again!"
): void => {
  const errorMessage = extractErrorMessage(error, fallbackMessage);
  toast.error(errorMessage);
};