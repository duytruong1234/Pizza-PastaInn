import { AxiosError, isAxiosError } from 'axios';

type ApiErrorData = {
  message?: string;
};

export function getApiErrorMessage(err: unknown) {
  if (isAxiosError<ApiErrorData>(err)) {
    const axiosError = err as AxiosError<ApiErrorData>;
    const method = axiosError.config?.method?.toUpperCase() || 'REQUEST';
    const url = axiosError.config?.url || 'unknown URL';
    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message || axiosError.message || 'Unknown error';

    return status ? `${method} ${url} failed with ${status}: ${message}` : `${method} ${url} failed: ${message}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return String(err);
}

export function getApiErrorStatus(err: unknown) {
  return isAxiosError(err) ? err.response?.status : undefined;
}
