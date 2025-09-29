/**
 * HTTP客户端模块
 * 提供统一的HTTP请求功能，支持文件上传和超时控制
 */

import { BACKEND_CONFIG } from './backend-config';

// === 类型定义 ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  data?: any;
  timeout?: number;
}

/**
 * HTTP客户端类
 * 封装所有HTTP请求功能，提供统一的错误处理和重试机制
 */
export class HttpClient {
  private config: HttpClientConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: BACKEND_CONFIG.TIMEOUT,
      retries: BACKEND_CONFIG.MAX_RETRIES,
      ...config
    };

    this.defaultHeaders = {

      'Content-Type': 'application/json; charset=utf-8',
      'X-API-Key': this.config.apiKey,
      'User-Agent': 'WDWxEdit-v2-Client/1.0'

    };

    if (BACKEND_CONFIG.DEBUG) {

    }
  }

  /**
   * 通用HTTP请求方法
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      params,
      data,
      timeout = this.config.timeout
    } = options;

    try {

      const url = this.buildUrl(endpoint, params);

      const requestHeaders = { ...this.defaultHeaders, ...headers };

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,

        body: data ? this.serializeWithoutUnicodeEscape(data) : undefined,
        // Claude Code Add - CORS处理配置
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache'
      };

      // Claude Code Add - 仅显示Unicode转义相关的关键调试
      if (BACKEND_CONFIG.DEBUG) {
        const bodyContent = requestOptions.body as string;
        const hasUnicodeEscape = bodyContent ? /\\u[0-9a-fA-F]{4}/.test(bodyContent) : false;

        if (hasUnicodeEscape || url.includes('create-draft') || url.includes('update-draft')) {
          console.log(`🚨 HTTP请求Unicode检查 [${method} ${endpoint}]:`, {
            hasUnicodeEscape,
            titleInBody: bodyContent?.includes('title') ? 
              bodyContent.match(/"title":"[^"]*"/)?.[0] : 'title not found',
            firstUnicodeMatch: hasUnicodeEscape ? bodyContent?.match(/\\u[0-9a-fA-F]{4}/)?.[0] : 'none'
          });
        }
      }

      const response = await this.requestWithTimeout(url, requestOptions, timeout!);
      
      // Claude Code Add - 响应头调试信息
      if (BACKEND_CONFIG.DEBUG) {
        console.log(`📥 收到HTTP响应:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok,
          redirected: response.redirected,
          type: response.type,
          url: response.url
        });
      }

      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        };

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (BACKEND_CONFIG.DEBUG) {

      }

      return result as ApiResponse<T>;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Claude Code Add - 增强的错误日志
      console.error(`❌ ${method} ${endpoint} 失败:`, {
        error: errorMsg,
        errorType: error.constructor.name,
        stack: error instanceof Error ? error.stack : undefined,
        url: this.buildUrl(endpoint, params),
        method,
        timestamp: new Date().toISOString()
      });

      if (errorMsg.includes('CORS') || errorMsg.includes('fetch')) {
        console.error(`🚫 CORS错误详细信息:`, {
          message: '可能的CORS问题原因:',
          reasons: [
            '1. 后端服务未启动或无法访问',
            '2. 后端CORS配置不正确',
            '3. 预检请求(OPTIONS)失败',
            '4. Access-Control-Allow-Origin头缺失',
            '5. 请求头被拒绝'
          ],
          suggestions: [
            '检查后端服务是否运行在 localhost:8000',
            '验证后端CORS配置是否包含 app://obsidian.md',
            '确认API密钥是否正确',
            '检查网络连接'
          ]
        });
      }

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', data });
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', data });
  }

  /**
   * 文件上传方法（支持base64数据）
   */
  async uploadFile<T = any>(
    endpoint: string,
    file: string | Blob,
    filename: string,
    extra?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      let fileData: string;

      if (typeof file === 'string') {
        fileData = file;
      } else {
        // Blob转base64
        fileData = await this.blobToBase64(file);
      }

      const requestData = {
        image_data: fileData,
        filename,
        ...extra
      };

      return this.post<T>(endpoint, requestData);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (BACKEND_CONFIG.DEBUG) {

      }

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 表单数据上传方法（支持multipart/form-data）
   */
  async uploadFormData<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      const headers = {
        'X-API-Key': this.config.apiKey
      };

      const requestOptions: RequestInit = {
        method: 'POST',
        headers,
        body: formData
      };

      const response = await this.requestWithTimeout(url, requestOptions, this.config.timeout!);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (BACKEND_CONFIG.DEBUG) {

      }

      return result as ApiResponse<T>;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (BACKEND_CONFIG.DEBUG) {

      }

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/v1/wechat/health');
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.defaultHeaders['X-API-Key'] = newConfig.apiKey;
    }
    
    if (BACKEND_CONFIG.DEBUG) {

    }
  }

  // === 私有辅助方法 ===
  
  /**
   * 构建完整的请求URL
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  /**
   * 带超时的请求方法
   */
  private async requestWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Blob转base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;

        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Claude Code Add - 自定义JSON序列化，避免Unicode转义
   */
  private serializeWithoutUnicodeEscape(data: any): string {
    try {

      let json = JSON.stringify(data, null, 0);

      if (/\\u[0-9a-fA-F]{4}/.test(json)) {

        json = json.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
          const char = String.fromCharCode(parseInt(code, 16));

          return char;
        });

      }
      
      return json;
    } catch (error) {

      return JSON.stringify(data, null, 0);
    }
  }
}