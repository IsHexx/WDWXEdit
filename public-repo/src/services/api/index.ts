/**
 * API模块统一入口
 * 提供所有API相关的类、类型和函数的统一导出
 */

// === 配置管理 ===
export {
  BACKEND_CONFIG,
  validateBackendConfig,
  getBackendConfigInfo,
  getApiEndpoint
} from './backend-config';

export type {
  BackendConfigInfo,
  ConfigValidationResult
} from './backend-config';

// === HTTP客户端 ===
export {
  HttpClient
} from './http-client';

export type {
  ApiResponse,
  HttpClientConfig,
  RequestOptions
} from './http-client';

// === 微信API ===
export {
  WechatClient
} from './wechat-api';

export type {
  WechatAuth,
  WechatTokenResponse,
  MediaUpload,
  MediaResult,
  DraftArticle,
  DraftResult,
  PublishResult,
  MediaListParams,
  MediaListResult,
  DraftListResult,
  PublishStatusResult
} from './wechat-api';

import { BACKEND_CONFIG, getBackendConfigInfo } from './backend-config';
import { HttpClient, HttpClientConfig } from './http-client';
import { WechatClient, WechatTokenResponse, MediaResult, DraftArticle, DraftResult } from './wechat-api';

// === 全局实例管理 ===
let globalHttpClient: HttpClient | null = null;
let globalWechatClient: WechatClient | null = null;

/**
 * 初始化HTTP客户端
 * @param config HTTP客户端配置
 */
export function initHttpClient(config: HttpClientConfig): void {
  globalHttpClient = new HttpClient(config);

}

/**
 * 初始化微信客户端
 * @param httpClient HTTP客户端实例（可选，如果未提供则使用全局实例）
 */
export function initWechatClient(httpClient?: HttpClient): void {
  if (!httpClient && !globalHttpClient) {
    throw new Error('HTTP客户端未初始化，请先调用 initHttpClient() 或传入 httpClient 参数');
  }
  
  globalWechatClient = new WechatClient(httpClient || globalHttpClient!);

}

/**
 * 获取全局HTTP客户端实例
 * @returns HTTP客户端实例
 */
export function getHttpClient(): HttpClient {
  if (!globalHttpClient) {
    throw new Error('HTTP客户端未初始化，请先调用 initHttpClient()');
  }
  return globalHttpClient;
}

/**
 * 获取全局微信客户端实例
 * @returns 微信客户端实例
 */
export function getWechatClient(): WechatClient {
  if (!globalWechatClient) {
    throw new Error('微信客户端未初始化，请先调用 initWechatClient()');
  }
  return globalWechatClient;
}

// === 工具函数 ===

/**
 * 检查是否应该使用后端代理模式
 * @returns 是否使用后端代理
 */
export function shouldUseBackendProxy(): boolean {
  return BACKEND_CONFIG.USE_BACKEND_PROXY && 
         !!BACKEND_CONFIG.SERVER_URL && 
         !!BACKEND_CONFIG.API_KEY;
}

/**
 * 获取当前API模式描述
 * @returns API模式描述
 */
export function getApiMode(): string {
  return shouldUseBackendProxy() 
    ? '后端代理模式' 
    : '直接调用模式(已弃用)';
}

// === 调试工具 ===
export const WechatApiUtils = {
  /**
   * 检查是否使用后端代理
   */
  shouldUseBackendProxy,

  /**
   * 获取API模式描述
   */
  getApiMode,

  /**
   * 测试后端连接
   */
  async testBackendConnection(): Promise<boolean> {
    try {
      const client = getWechatClient();
      return await client.healthCheck();
    } catch (error) {

      return false;
    }
  },

  /**
   * 获取当前配置信息
   */
  getCurrentConfig() {
    return {
      proxyMode: shouldUseBackendProxy(),
      serverUrl: BACKEND_CONFIG.SERVER_URL,
      hasApiKey: !!BACKEND_CONFIG.API_KEY,
      httpClientInitialized: !!globalHttpClient,
      wechatClientInitialized: !!globalWechatClient,
      configInfo: getBackendConfigInfo()
    };
  }
};

// === 兼容性函数实现 ===

/**
 * 获取微信Token（兼容性函数的实际实现）
 */
export async function wxGetToken(appid: string, secret: string): Promise<WechatTokenResponse> {
  const client = getWechatClient();
  return await client.authenticate({ appId: appid, appSecret: secret });
}

/**
 * 上传图片到微信（兼容性函数的实际实现）
 */
export async function wxUploadImage(
  data: Blob, 
  filename: string, 
  token: string, 
  type?: string
): Promise<MediaResult> {
  const client = getWechatClient();
  
  // Blob转base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });

  return await client.uploadMedia({
    mediaData: base64Data,
    filename,
    accessToken: token,
    storageType: type === 'image' ? 'permanent' : 'temporary'
  });
}

/**
 * 添加草稿（兼容性函数的实际实现）
 */
export async function wxAddDraft(articles: DraftArticle[], token: string): Promise<DraftResult> {
  const client = getWechatClient();
  return await client.createDraft(articles, token);
}

// === 便捷初始化函数 ===

/**
 * 一键初始化API客户端
 * 使用默认配置初始化HTTP客户端和微信客户端
 */
export function initApiClients(): void {

  initHttpClient({
    baseUrl: BACKEND_CONFIG.SERVER_URL,
    apiKey: BACKEND_CONFIG.API_KEY,
    timeout: BACKEND_CONFIG.TIMEOUT,
    retries: BACKEND_CONFIG.MAX_RETRIES
  });

  initWechatClient();

}

// === 启动时日志 ===
console.log(`🔗 微信API模式: ${getApiMode()}`);

// === 别名函数（兼容性） ===

/**
 * 获取发布客户端（别名函数）
 * @returns 微信客户端实例
 */
export function getPublisherClient(): WechatClient {
  return getWechatClient();
}

