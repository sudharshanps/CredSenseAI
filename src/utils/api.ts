/**
 * CredSense AI - Safe API Client Utility
 * Guarantees strict Content-Type validation, robust error captures, and zero Unexpected Token '<' failures.
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

/**
 * Robust fetch wrapper with content-type checking and descriptive error captures
 */
export async function safeFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (networkError: any) {
    throw new Error(`Network error connecting to ${urlString}: ${networkError?.message || String(networkError)}`);
  }

  const contentType = response.headers.get('content-type') || '';

  // If response is not ok
  if (!response.ok) {
    let errorMessage = `API request failed with HTTP ${response.status} on ${urlString}`;
    if (contentType.includes('application/json')) {
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.error || errorJson.message || errorJson.details || errorMessage;
      } catch {
        // fallback
      }
    } else {
      const text = await response.text();
      errorMessage = `Server returned (${response.status}): ${text.substring(0, 300) || response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // If response is ok but content-type is not JSON
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON from ${urlString} but received ${contentType || 'non-JSON'}: ${text.substring(0, 300)}`
    );
  }

  try {
    const data = (await response.json()) as T;
    return data;
  } catch (jsonErr: any) {
    throw new Error(`Failed to parse JSON response from ${urlString}: ${jsonErr?.message}`);
  }
}
