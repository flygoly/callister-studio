export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / 4))
}

export class ProviderHttpError extends Error {
  readonly statusCode: number
  readonly retryable: boolean

  constructor(message: string, statusCode: number, retryable = false) {
    super(message)
    this.name = 'ProviderHttpError'
    this.statusCode = statusCode
    this.retryable = retryable
  }
}

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string }; message?: string }
    return data.error?.message ?? data.message ?? response.statusText
  } catch {
    return response.statusText || `HTTP ${response.status}`
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}
