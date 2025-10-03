import { API_CONFIG } from '../../constants'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // Use the configured BASE_URL for all environments
    this.baseUrl = baseUrl || API_CONFIG.BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${this.baseUrl}${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        }
      }

      return {
        success: true,
        data,
        statusCode: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async get<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    })
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async delete<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
