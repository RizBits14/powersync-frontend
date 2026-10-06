import { ApiError } from "./api-error";

const REQUEST_TIMEOUT = 10_000;

function getErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Backend request failed.";
}

export async function backendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.POWERSYNC_API_BASE_URL;

  if (!baseUrl) {
    throw new ApiError(500, "Backend API URL is not configured.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
      signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new ApiError(502, "Backend returned an invalid JSON response.");
    }

    if (!response.ok) {
      throw new ApiError(response.status, getErrorMessage(payload));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ApiError(504, "Backend request timed out.");
    }

    throw new ApiError(502, "Unable to connect to PowerSync backend.");
  }
}
