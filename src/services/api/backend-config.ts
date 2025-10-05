/**
 * 后端配置管理模块
 * 提供后端服务连接配置和验证功能
 */

// === 类型定义 ===
export interface BackendConfigInfo {
  serverUrl: string;
  hasApiKey: boolean;
  apiKeyLength: number;
  useBackendProxy: boolean;
  timeout: number;
  maxRetries: number;
}

export interface ConfigValidationResult {
  valid: boolean;
  error?: string;
}

// === 后端配置常量 ===
export const BACKEND_CONFIG = {
  SERVER_URL: 'http://localhost:8000',
  API_KEY: 'wdwxedit-api-key-2024',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  USE_BACKEND_PROXY: true,
  HEALTH_CHECK_INTERVAL: 60000,
  DEBUG: false
} as const;

/**
 * 构建完整的API端点URL
 * @param path API路径，如 '/api/v1/health'
 * @returns 完整的API URL
 */
export function getApiEndpoint(path: string): string {
  return `${BACKEND_CONFIG.SERVER_URL}${path}`;
}

/**
 * 获取当前后端配置信息
 * @returns 配置信息对象
 */
export function getBackendConfigInfo(): BackendConfigInfo {
  return {
    serverUrl: BACKEND_CONFIG.SERVER_URL,
    hasApiKey: !!BACKEND_CONFIG.API_KEY,
    apiKeyLength: BACKEND_CONFIG.API_KEY.length,
    useBackendProxy: BACKEND_CONFIG.USE_BACKEND_PROXY,
    timeout: BACKEND_CONFIG.TIMEOUT,
    maxRetries: BACKEND_CONFIG.MAX_RETRIES
  };
}

/**
 * 验证后端配置的完整性和有效性
 * @returns 验证结果
 */
export function validateBackendConfig(): ConfigValidationResult {

  if (!BACKEND_CONFIG.SERVER_URL) {
    return { valid: false, error: '服务器地址未配置' };
  }

  if (!BACKEND_CONFIG.API_KEY) {
    return { valid: false, error: 'API密钥未配置' };
  }

  if (BACKEND_CONFIG.API_KEY.length < 8) {
    return { valid: false, error: 'API密钥长度过短，建议至少8位' };
  }

  try {
    new URL(BACKEND_CONFIG.SERVER_URL);
  } catch {
    return { valid: false, error: '服务器地址格式无效' };
  }
  
  return { valid: true };
}

// === 启动时配置验证 ===
const validationResult = validateBackendConfig();
if (validationResult.valid) {
  console.log('✅ 后端配置验证通过:', getBackendConfigInfo());
} else {

}
