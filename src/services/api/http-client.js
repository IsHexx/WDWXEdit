// Claude Code Update
/**
 * HTTP客户端模块
 * 提供统一的HTTP请求功能，支持文件上传和超时控制
 */
import { BACKEND_CONFIG } from './backend-config';
/**
 * HTTP客户端类
 * 封装所有HTTP请求功能，提供统一的错误处理和重试机制
 */
export class HttpClient {
    constructor(config) {
        this.config = {
            timeout: BACKEND_CONFIG.TIMEOUT,
            retries: BACKEND_CONFIG.MAX_RETRIES,
            ...config
        };
        this.defaultHeaders = {
            // 明确指定UTF-8编码，避免Unicode转义问题
            'Content-Type': 'application/json; charset=utf-8',
            'X-API-Key': this.config.apiKey,
            'User-Agent': 'WDWxEdit-v2-Client/1.0'
        };
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔧 HTTP客户端初始化:', {
                baseUrl: this.config.baseUrl,
                timeout: this.config.timeout,
                retries: this.config.retries
            });
        }
    }
    /**
     * 通用HTTP请求方法
     */
    async request(endpoint, options = {}) {
        var _a, _b;
        const { method = 'GET', headers = {}, params, data, timeout = this.config.timeout } = options;
        try {
            // 构建完整URL
            const url = this.buildUrl(endpoint, params);
            // 合并请求头
            const requestHeaders = { ...this.defaultHeaders, ...headers };
            // 构建请求选项
            const requestOptions = {
                method,
                headers: requestHeaders,
                // 使用自定义序列化避免Unicode转义
                body: data ? this.serializeWithoutUnicodeEscape(data) : undefined,
                // CORS处理配置
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache'
            };
            // 仅显示Unicode转义相关的关键调试
            if (BACKEND_CONFIG.DEBUG) {
                const bodyContent = requestOptions.body;
                const hasUnicodeEscape = bodyContent ? /\\u[0-9a-fA-F]{4}/.test(bodyContent) : false;
                // 只有在有Unicode转义或者是创建草稿请求时才显示详细信息
                if (hasUnicodeEscape || url.includes('create-draft') || url.includes('update-draft')) {
                    console.log(`🚨 HTTP请求Unicode检查 [${method} ${endpoint}]:`, {
                        hasUnicodeEscape,
                        titleInBody: (bodyContent === null || bodyContent === void 0 ? void 0 : bodyContent.includes('title')) ?
                            (_a = bodyContent.match(/"title":"[^"]*"/)) === null || _a === void 0 ? void 0 : _a[0] : 'title not found',
                        firstUnicodeMatch: hasUnicodeEscape ? (_b = bodyContent === null || bodyContent === void 0 ? void 0 : bodyContent.match(/\\u[0-9a-fA-F]{4}/)) === null || _b === void 0 ? void 0 : _b[0] : 'none'
                    });
                }
            }
            // 发送请求（带超时控制）
            const response = await this.requestWithTimeout(url, requestOptions, timeout);
            // 响应头调试信息
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
            // 检查HTTP状态
            if (!response.ok) {
                const errorDetails = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url
                };
                if (BACKEND_CONFIG.DEBUG) {
                    console.error(`❌ HTTP错误详情:`, errorDetails);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            // 解析响应
            const result = await response.json();
            if (BACKEND_CONFIG.DEBUG) {
                console.log(`✅ ${method} ${endpoint} 成功:`, result);
            }
            return result;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const lower = (errorMsg || '').toLowerCase();
            // 增强的错误日志（仅在DEBUG时输出）
            if (BACKEND_CONFIG.DEBUG) {
                console.error(`❌ ${method} ${endpoint} 失败:`, {
                    error: errorMsg,
                    errorType: (error === null || error === void 0 ? void 0 : error.name) || error.constructor.name,
                    stack: error instanceof Error ? error.stack : undefined,
                    url: this.buildUrl(endpoint, params),
                    method,
                    timestamp: new Date().toISOString()
                });
            }
            // 友好化网络类错误
            const isTimeout = lower.includes('aborted') || lower.includes('timeout');
            const isBackendDown = lower.includes('failed to fetch')
                || lower.includes('networkerror')
                || lower.includes('err_connection_refused')
                || lower.includes('connection refused');
            if (isBackendDown) {
                const friendly = '无法连接到服务器，请确认后端服务已启动（如：http://localhost:8000）。';
                return { success: false, error: friendly };
            }
            if (isTimeout) {
                return { success: false, error: '请求超时，请检查网络连接或稍后重试。' };
            }
            // 仅在明确为CORS提示时打印详细信息，避免误导
            if (errorMsg.includes('CORS') && !lower.includes('failed to fetch')) {
                if (BACKEND_CONFIG.DEBUG) {
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
    async get(endpoint, params) {
        return this.request(endpoint, { method: 'GET', params });
    }
    /**
     * POST请求
     */
    async post(endpoint, data) {
        return this.request(endpoint, { method: 'POST', data });
    }
    /**
     * PUT请求
     */
    async put(endpoint, data) {
        return this.request(endpoint, { method: 'PUT', data });
    }
    /**
     * DELETE请求
     */
    async delete(endpoint, data) {
        return this.request(endpoint, { method: 'DELETE', data });
    }
    /**
     * 文件上传方法（支持base64数据）
     */
    async uploadFile(endpoint, file, filename, extra) {
        try {
            let fileData;
            // 处理不同类型的文件输入
            if (typeof file === 'string') {
                fileData = file;
            }
            else {
                // Blob转base64
                fileData = await this.blobToBase64(file);
            }
            // 构建请求数据
            const requestData = {
                image_data: fileData,
                filename,
                ...extra
            };
            // 使用JSON格式发送（后端支持base64）
            return this.post(endpoint, requestData);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (BACKEND_CONFIG.DEBUG) {
                console.error(`❌ 文件上传失败:`, errorMsg);
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
    async uploadFormData(endpoint, formData) {
        try {
            const url = this.buildUrl(endpoint);
            // 构建请求头（不设置Content-Type，让浏览器自动设置）
            const headers = {
                'X-API-Key': this.config.apiKey
            };
            const requestOptions = {
                method: 'POST',
                headers,
                body: formData
            };
            // 发送请求
            const response = await this.requestWithTimeout(url, requestOptions, this.config.timeout);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            if (BACKEND_CONFIG.DEBUG) {
                console.log(`✅ FormData上传成功:`, result);
            }
            return result;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (BACKEND_CONFIG.DEBUG) {
                console.error(`❌ FormData上传失败:`, errorMsg);
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
    async healthCheck() {
        try {
            const response = await this.get('/api/v1/wechat/health');
            return response.success;
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.apiKey) {
            this.defaultHeaders['X-API-Key'] = newConfig.apiKey;
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔧 HTTP客户端配置更新:', this.config);
        }
    }
    // === 私有辅助方法 ===
    /**
     * 构建完整的请求URL
     */
    buildUrl(endpoint, params) {
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
    async requestWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return response;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Blob转base64
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                // 移除data:image/...;base64,前缀
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    /**
     * 自定义JSON序列化，避免Unicode转义
     */
    serializeWithoutUnicodeEscape(data) {
        try {
            // 首先尝试标准序列化
            let json = JSON.stringify(data, null, 0);
            // 如果发现Unicode转义，进行还原并记录
            if (/\\u[0-9a-fA-F]{4}/.test(json)) {
                console.log('🚨 JSON序列化中发现Unicode转义，正在还原...');
                // 将Unicode转义序列还原为原始字符
                json = json.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
                    const char = String.fromCharCode(parseInt(code, 16));
                    console.log(`  还原: ${match} → ${char}`);
                    return char;
                });
                console.log('✅ Unicode转义已还原');
            }
            return json;
        }
        catch (error) {
            console.error('❌ 自定义JSON序列化失败:', error);
            return JSON.stringify(data, null, 0);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC1jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwLWNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQkFBcUI7QUFDckI7OztHQUdHO0FBRUgsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBd0JsRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQUlyQixZQUFZLE1BQXdCO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixPQUFPLEVBQUUsY0FBYyxDQUFDLE9BQU87WUFDL0IsT0FBTyxFQUFFLGNBQWMsQ0FBQyxXQUFXO1lBQ25DLEdBQUcsTUFBTTtTQUNWLENBQUM7UUFFRixJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCLDRCQUE0QjtZQUM1QixjQUFjLEVBQUUsaUNBQWlDO1lBQ2pELFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDL0IsWUFBWSxFQUFFLHdCQUF3QjtTQUN2QyxDQUFDO1FBRUYsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzVCLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzVCLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzVCLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87YUFDN0IsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFVLFFBQWdCLEVBQUUsVUFBMEIsRUFBRTs7UUFDbkUsTUFBTSxFQUNKLE1BQU0sR0FBRyxLQUFLLEVBQ2QsT0FBTyxHQUFHLEVBQUUsRUFDWixNQUFNLEVBQ04sSUFBSSxFQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFDOUIsR0FBRyxPQUFPLENBQUM7UUFFWixJQUFJO1lB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SUFBSSxFQUFFLEVBQUU7b0JBQzFELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ3hDLE9BQU8sSUFBSSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUMvQjtZQUVELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdEM7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDbGF1ZGUgQ29kZSBVcGRhdGVcbi8qKlxuICogSFRUUOWuouaIt+err+aooeWdl1xuICog5o+Q5L6b57uf5LiA55qESFRUUOivt+axguWKn+iDve+8jOaUr+aMgeaWh+S7tuS4iuS8oOWSjOi2heaXtuaOp+WItlxuICovXG5cbmltcG9ydCB7IEJBQ0tFTkRfQ09ORklHIH0gZnJvbSAnLi9iYWNrZW5kLWNvbmZpZyc7XG5cbi8vID09PSDnsbvlnovlrprkuYkgPT09XG5leHBvcnQgaW50ZXJmYWNlIEFwaVJlc3BvbnNlPFQgPSBhbnk+IHtcbiAgc3VjY2VzczogYm9vbGVhbjtcbiAgZGF0YT86IFQ7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBDbGllbnRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICB0aW1lb3V0PzogbnVtYmVyO1xuICByZXRyaWVzPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlcXVlc3RPcHRpb25zIHtcbiAgbWV0aG9kPzogJ0dFVCcgfCAnUE9TVCcgfCAnUFVUJyB8ICdERUxFVEUnO1xuICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPjtcbiAgZGF0YT86IGFueTtcbiAgdGltZW91dD86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBIVFRQ5a6i5oi356uv57G7XG4gKiDlsIHoo4XmiYDmnIlIVFRQ6K+35rGC5Yqf6IO977yM5o+Q5L6b57uf5LiA55qE6ZSZ6K+v5aSE55CG5ZKM6YeN6K+V5py65Yi2XG4gKi9cbmV4cG9ydCBjbGFzcyBIdHRwQ2xpZW50IHtcbiAgcHJpdmF0ZSBjb25maWc6IEh0dHBDbGllbnRDb25maWc7XG4gIHByaXZhdGUgZGVmYXVsdEhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBIdHRwQ2xpZW50Q29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICB0aW1lb3V0OiBCQUNLRU5EX0NPTkZJRy5USU1FT1VULFxuICAgICAgcmV0cmllczogQkFDS0VORF9DT05GSUcuTUFYX1JFVFJJRVMsXG4gICAgICAuLi5jb25maWdcbiAgICB9O1xuXG4gICAgdGhpcy5kZWZhdWx0SGVhZGVycyA9IHtcbiAgICAgIC8vIOaYjuehruaMh+WumlVURi0457yW56CB77yM6YG/5YWNVW5pY29kZei9rOS5iemXrumimFxuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAgICdYLUFQSS1LZXknOiB0aGlzLmNvbmZpZy5hcGlLZXksXG4gICAgICAnVXNlci1BZ2VudCc6ICdXRFd4RWRpdC12Mi1DbGllbnQvMS4wJ1xuICAgIH07XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SnIEhUVFDlrqLmiLfnq6/liJ3lp4vljJY6Jywge1xuICAgICAgICBiYXNlVXJsOiB0aGlzLmNvbmZpZy5iYXNlVXJsLFxuICAgICAgICB0aW1lb3V0OiB0aGlzLmNvbmZpZy50aW1lb3V0LFxuICAgICAgICByZXRyaWVzOiB0aGlzLmNvbmZpZy5yZXRyaWVzXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6YCa55SoSFRUUOivt+axguaWueazlVxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdDxUID0gYW55PihlbmRwb2ludDogc3RyaW5nLCBvcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyA9IHt9KTogUHJvbWlzZTxBcGlSZXNwb25zZTxUPj4ge1xuICAgIGNvbnN0IHtcbiAgICAgIG1ldGhvZCA9ICdHRVQnLFxuICAgICAgaGVhZGVycyA9IHt9LFxuICAgICAgcGFyYW1zLFxuICAgICAgZGF0YSxcbiAgICAgIHRpbWVvdXQgPSB0aGlzLmNvbmZpZy50aW1lb3V0XG4gICAgfSA9IG9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgLy8g5p6E5bu65a6M5pW0VVJMXG4gICAgICBjb25zdCB1cmwgPSB0aGlzLmJ1aWxkVXJsKGVuZHBvaW50LCBwYXJhbXMpO1xuICAgICAgXG4gICAgICAvLyDlkIjlubbor7fmsYLlpLRcbiAgICAgIGNvbnN0IHJlcXVlc3RIZWFkZXJzID0geyAuLi50aGlzLmRlZmF1bHRIZWFkZXJzLCAuLi5oZWFkZXJzIH07XG4gICAgICBcbiAgICAgIC8vIOaehOW7uuivt+axgumAiemhuVxuICAgICAgY29uc3QgcmVxdWVzdE9wdGlvbnM6IFJlcXVlc3RJbml0ID0ge1xuICAgICAgICBtZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IHJlcXVlc3RIZWFkZXJzLFxuICAgICAgICAvLyDkvb/nlKjoh6rlrprkuYnluo/liJfljJbpgb/lhY1Vbmljb2Rl6L2s5LmJXG4gICAgICAgIGJvZHk6IGRhdGEgPyB0aGlzLnNlcmlhbGl6ZVdpdGhvdXRVbmljb2RlRXNjYXBlKGRhdGEpIDogdW5kZWZpbmVkLFxuICAgICAgICAvLyBDT1JT5aSE55CG6YWN572uXG4gICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdvbWl0JyxcbiAgICAgICAgY2FjaGU6ICduby1jYWNoZSdcbiAgICAgIH07XG5cbiAgICAgIC8vIOS7heaYvuekulVuaWNvZGXovazkuYnnm7jlhbPnmoTlhbPplK7osIPor5VcbiAgICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgICBjb25zdCBib2R5Q29udGVudCA9IHJlcXVlc3RPcHRpb25zLmJvZHkgYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBoYXNVbmljb2RlRXNjYXBlID0gYm9keUNvbnRlbnQgPyAvXFxcXHVbMC05YS1mQS1GXXs0fS8udGVzdChib2R5Q29udGVudCkgOiBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWPquacieWcqOaciVVuaWNvZGXovazkuYnmiJbogIXmmK/liJvlu7rojYnnqL/or7fmsYLml7bmiY3mmL7npLror6bnu4bkv6Hmga9cbiAgICAgICAgaWYgKGhhc1VuaWNvZGVFc2NhcGUgfHwgdXJsLmluY2x1ZGVzKCdjcmVhdGUtZHJhZnQnKSB8fCB1cmwuaW5jbHVkZXMoJ3VwZGF0ZS1kcmFmdCcpKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYPCfmqggSFRUUOivt+axglVuaWNvZGXmo4Dmn6UgWyR7bWV0aG9kfSAke2VuZHBvaW50fV06YCwge1xuICAgICAgICAgICAgaGFzVW5pY29kZUVzY2FwZSxcbiAgICAgICAgICAgIHRpdGxlSW5Cb2R5OiBib2R5Q29udGVudD8uaW5jbHVkZXMoJ3RpdGxlJykgPyBcbiAgICAgICAgICAgICAgYm9keUNvbnRlbnQubWF0Y2goL1widGl0bGVcIjpcIlteXCJdKlwiLyk/LlswXSA6ICd0aXRsZSBub3QgZm91bmQnLFxuICAgICAgICAgICAgZmlyc3RVbmljb2RlTWF0Y2g6IGhhc1VuaWNvZGVFc2NhcGUgPyBib2R5Q29udGVudD8ubWF0Y2goL1xcXFx1WzAtOWEtZkEtRl17NH0vKT8uWzBdIDogJ25vbmUnXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8g5Y+R6YCB6K+35rGC77yI5bim6LaF5pe25o6n5Yi277yJXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucmVxdWVzdFdpdGhUaW1lb3V0KHVybCwgcmVxdWVzdE9wdGlvbnMsIHRpbWVvdXQhKTtcbiAgICAgIFxuICAgICAgLy8g5ZON5bqU5aS06LCD6K+V5L+h5oGvXG4gICAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgICAgY29uc29sZS5sb2coYPCfk6Ug5pS25YiwSFRUUOWTjeW6lDpgLCB7XG4gICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogcmVzcG9uc2Uuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBPYmplY3QuZnJvbUVudHJpZXMocmVzcG9uc2UuaGVhZGVycy5lbnRyaWVzKCkpLFxuICAgICAgICAgIG9rOiByZXNwb25zZS5vayxcbiAgICAgICAgICByZWRpcmVjdGVkOiByZXNwb25zZS5yZWRpcmVjdGVkLFxuICAgICAgICAgIHR5cGU6IHJlc3BvbnNlLnR5cGUsXG4gICAgICAgICAgdXJsOiByZXNwb25zZS51cmxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIOajgOafpUhUVFDnirbmgIFcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgY29uc3QgZXJyb3JEZXRhaWxzID0ge1xuICAgICAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogT2JqZWN0LmZyb21FbnRyaWVzKHJlc3BvbnNlLmhlYWRlcnMuZW50cmllcygpKSxcbiAgICAgICAgICB1cmw6IHJlc3BvbnNlLnVybFxuICAgICAgICB9O1xuICAgICAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGDinYwgSFRUUOmUmeivr+ivpuaDhTpgLCBlcnJvckRldGFpbHMpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c306ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cblxuICAgICAgLy8g6Kej5p6Q5ZON5bqUXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICBcbiAgICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgICBjb25zb2xlLmxvZyhg4pyFICR7bWV0aG9kfSAke2VuZHBvaW50fSDmiJDlip86YCwgcmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdCBhcyBBcGlSZXNwb25zZTxUPjtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnN0IGxvd2VyID0gKGVycm9yTXNnIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAvLyDlop7lvLrnmoTplJnor6/ml6Xlv5fvvIjku4XlnKhERUJVR+aXtui+k+WHuu+8iVxuICAgICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCAke21ldGhvZH0gJHtlbmRwb2ludH0g5aSx6LSlOmAsIHtcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgICAgZXJyb3JUeXBlOiAoZXJyb3IgYXMgYW55KT8ubmFtZSB8fCBlcnJvci5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdXJsOiB0aGlzLmJ1aWxkVXJsKGVuZHBvaW50LCBwYXJhbXMpLFxuICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8g5Y+L5aW95YyW572R57uc57G76ZSZ6K+vXG4gICAgICBjb25zdCBpc1RpbWVvdXQgPSBsb3dlci5pbmNsdWRlcygnYWJvcnRlZCcpIHx8IGxvd2VyLmluY2x1ZGVzKCd0aW1lb3V0Jyk7XG4gICAgICBjb25zdCBpc0JhY2tlbmREb3duID0gbG93ZXIuaW5jbHVkZXMoJ2ZhaWxlZCB0byBmZXRjaCcpXG4gICAgICAgIHx8IGxvd2VyLmluY2x1ZGVzKCduZXR3b3JrZXJyb3InKVxuICAgICAgICB8fCBsb3dlci5pbmNsdWRlcygnZXJyX2Nvbm5lY3Rpb25fcmVmdXNlZCcpXG4gICAgICAgIHx8IGxvd2VyLmluY2x1ZGVzKCdjb25uZWN0aW9uIHJlZnVzZWQnKTtcblxuICAgICAgaWYgKGlzQmFja2VuZERvd24pIHtcbiAgICAgICAgY29uc3QgZnJpZW5kbHkgPSAn5peg5rOV6L+e5o6l5Yiw5pyN5Yqh5Zmo77yM6K+356Gu6K6k5ZCO56uv5pyN5Yqh5bey5ZCv5Yqo77yI5aaC77yaaHR0cDovL2xvY2FsaG9zdDo4MDAw77yJ44CCJztcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBmcmllbmRseSB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNUaW1lb3V0KSB7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ+ivt+axgui2heaXtu+8jOivt+ajgOafpee9kee7nOi/nuaOpeaIlueojeWQjumHjeivleOAgicgfTtcbiAgICAgIH1cblxuICAgICAgLy8g5LuF5Zyo5piO56Gu5Li6Q09SU+aPkOekuuaXtuaJk+WNsOivpue7huS/oeaBr++8jOmBv+WFjeivr+WvvFxuICAgICAgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCdDT1JTJykgJiYgIWxvd2VyLmluY2x1ZGVzKCdmYWlsZWQgdG8gZmV0Y2gnKSkge1xuICAgICAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGDwn5qrIENPUlPplJnor6/or6bnu4bkv6Hmga86YCwge1xuICAgICAgICAgICAgbWVzc2FnZTogJ+WPr+iDveeahENPUlPpl67popjljp/lm6A6JyxcbiAgICAgICAgICAgIHJlYXNvbnM6IFtcbiAgICAgICAgICAgICAgJzEuIOWQjuerr+acjeWKoeacquWQr+WKqOaIluaXoOazleiuv+mXricsXG4gICAgICAgICAgICAgICcyLiDlkI7nq69DT1JT6YWN572u5LiN5q2j56GuJyxcbiAgICAgICAgICAgICAgJzMuIOmihOajgOivt+axgihPUFRJT05TKeWksei0pScsXG4gICAgICAgICAgICAgICc0LiBBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW7lpLTnvLrlpLEnLFxuICAgICAgICAgICAgICAnNS4g6K+35rGC5aS06KKr5ouS57udJ1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiBbXG4gICAgICAgICAgICAgICfmo4Dmn6XlkI7nq6/mnI3liqHmmK/lkKbov5DooYzlnKggbG9jYWxob3N0OjgwMDAnLFxuICAgICAgICAgICAgICAn6aqM6K+B5ZCO56uvQ09SU+mFjee9ruaYr+WQpuWMheWQqyBhcHA6Ly9vYnNpZGlhbi5tZCcsXG4gICAgICAgICAgICAgICfnoa7orqRBUEnlr4bpkqXmmK/lkKbmraPnoa4nLFxuICAgICAgICAgICAgICAn5qOA5p+l572R57uc6L+e5o6lJ1xuICAgICAgICAgICAgXVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3JNc2dcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdFVOivt+axglxuICAgKi9cbiAgYXN5bmMgZ2V0PFQgPSBhbnk+KGVuZHBvaW50OiBzdHJpbmcsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4pOiBQcm9taXNlPEFwaVJlc3BvbnNlPFQ+PiB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdDxUPihlbmRwb2ludCwgeyBtZXRob2Q6ICdHRVQnLCBwYXJhbXMgfSk7XG4gIH1cblxuICAvKipcbiAgICogUE9TVOivt+axglxuICAgKi9cbiAgYXN5bmMgcG9zdDxUID0gYW55PihlbmRwb2ludDogc3RyaW5nLCBkYXRhPzogYW55KTogUHJvbWlzZTxBcGlSZXNwb25zZTxUPj4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3Q8VD4oZW5kcG9pbnQsIHsgbWV0aG9kOiAnUE9TVCcsIGRhdGEgfSk7XG4gIH1cblxuICAvKipcbiAgICogUFVU6K+35rGCXG4gICAqL1xuICBhc3luYyBwdXQ8VCA9IGFueT4oZW5kcG9pbnQ6IHN0cmluZywgZGF0YT86IGFueSk6IFByb21pc2U8QXBpUmVzcG9uc2U8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0PFQ+KGVuZHBvaW50LCB7IG1ldGhvZDogJ1BVVCcsIGRhdGEgfSk7XG4gIH1cblxuICAvKipcbiAgICogREVMRVRF6K+35rGCXG4gICAqL1xuICBhc3luYyBkZWxldGU8VCA9IGFueT4oZW5kcG9pbnQ6IHN0cmluZywgZGF0YT86IGFueSk6IFByb21pc2U8QXBpUmVzcG9uc2U8VD4+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0PFQ+KGVuZHBvaW50LCB7IG1ldGhvZDogJ0RFTEVURScsIGRhdGEgfSk7XG4gIH1cblxuICAvKipcbiAgICog5paH5Lu25LiK5Lyg5pa55rOV77yI5pSv5oyBYmFzZTY05pWw5o2u77yJXG4gICAqL1xuICBhc3luYyB1cGxvYWRGaWxlPFQgPSBhbnk+KFxuICAgIGVuZHBvaW50OiBzdHJpbmcsXG4gICAgZmlsZTogc3RyaW5nIHwgQmxvYixcbiAgICBmaWxlbmFtZTogc3RyaW5nLFxuICAgIGV4dHJhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICApOiBQcm9taXNlPEFwaVJlc3BvbnNlPFQ+PiB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBmaWxlRGF0YTogc3RyaW5nO1xuICAgICAgXG4gICAgICAvLyDlpITnkIbkuI3lkIznsbvlnovnmoTmlofku7bovpPlhaVcbiAgICAgIGlmICh0eXBlb2YgZmlsZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZmlsZURhdGEgPSBmaWxlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQmxvYui9rGJhc2U2NFxuICAgICAgICBmaWxlRGF0YSA9IGF3YWl0IHRoaXMuYmxvYlRvQmFzZTY0KGZpbGUpO1xuICAgICAgfVxuXG4gICAgICAvLyDmnoTlu7ror7fmsYLmlbDmja5cbiAgICAgIGNvbnN0IHJlcXVlc3REYXRhID0ge1xuICAgICAgICBpbWFnZV9kYXRhOiBmaWxlRGF0YSxcbiAgICAgICAgZmlsZW5hbWUsXG4gICAgICAgIC4uLmV4dHJhXG4gICAgICB9O1xuXG4gICAgICAvLyDkvb/nlKhKU09O5qC85byP5Y+R6YCB77yI5ZCO56uv5pSv5oyBYmFzZTY077yJXG4gICAgICByZXR1cm4gdGhpcy5wb3N0PFQ+KGVuZHBvaW50LCByZXF1ZXN0RGF0YSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICBcbiAgICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGDinYwg5paH5Lu25LiK5Lyg5aSx6LSlOmAsIGVycm9yTXNnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvck1zZ1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6KGo5Y2V5pWw5o2u5LiK5Lyg5pa55rOV77yI5pSv5oyBbXVsdGlwYXJ0L2Zvcm0tZGF0Ye+8iVxuICAgKi9cbiAgYXN5bmMgdXBsb2FkRm9ybURhdGE8VCA9IGFueT4oZW5kcG9pbnQ6IHN0cmluZywgZm9ybURhdGE6IEZvcm1EYXRhKTogUHJvbWlzZTxBcGlSZXNwb25zZTxUPj4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cmwgPSB0aGlzLmJ1aWxkVXJsKGVuZHBvaW50KTtcbiAgICAgIFxuICAgICAgLy8g5p6E5bu66K+35rGC5aS077yI5LiN6K6+572uQ29udGVudC1UeXBl77yM6K6p5rWP6KeI5Zmo6Ieq5Yqo6K6+572u77yJXG4gICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAnWC1BUEktS2V5JzogdGhpcy5jb25maWcuYXBpS2V5XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXF1ZXN0T3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBmb3JtRGF0YVxuICAgICAgfTtcblxuICAgICAgLy8g5Y+R6YCB6K+35rGCXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMucmVxdWVzdFdpdGhUaW1lb3V0KHVybCwgcmVxdWVzdE9wdGlvbnMsIHRoaXMuY29uZmlnLnRpbWVvdXQhKTtcbiAgICAgIFxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9OiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIFxuICAgICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGDinIUgRm9ybURhdGHkuIrkvKDmiJDlip86YCwgcmVzdWx0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdCBhcyBBcGlSZXNwb25zZTxUPjtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIFxuICAgICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCBGb3JtRGF0YeS4iuS8oOWksei0pTpgLCBlcnJvck1zZyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3JNc2dcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWBpeW6t+ajgOafpVxuICAgKi9cbiAgYXN5bmMgaGVhbHRoQ2hlY2soKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXQoJy9hcGkvdjEvd2VjaGF0L2hlYWx0aCcpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLnN1Y2Nlc3M7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOabtOaWsOmFjee9rlxuICAgKi9cbiAgdXBkYXRlQ29uZmlnKG5ld0NvbmZpZzogUGFydGlhbDxIdHRwQ2xpZW50Q29uZmlnPik6IHZvaWQge1xuICAgIHRoaXMuY29uZmlnID0geyAuLi50aGlzLmNvbmZpZywgLi4ubmV3Q29uZmlnIH07XG4gICAgXG4gICAgaWYgKG5ld0NvbmZpZy5hcGlLZXkpIHtcbiAgICAgIHRoaXMuZGVmYXVsdEhlYWRlcnNbJ1gtQVBJLUtleSddID0gbmV3Q29uZmlnLmFwaUtleTtcbiAgICB9XG4gICAgXG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+UpyBIVFRQ5a6i5oi356uv6YWN572u5pu05pawOicsIHRoaXMuY29uZmlnKTtcbiAgICB9XG4gIH1cblxuICAvLyA9PT0g56eB5pyJ6L6F5Yqp5pa55rOVID09PVxuICBcbiAgLyoqXG4gICAqIOaehOW7uuWujOaVtOeahOivt+axglVSTFxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZFVybChlbmRwb2ludDogc3RyaW5nLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+KTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGVuZHBvaW50LCB0aGlzLmNvbmZpZy5iYXNlVXJsKTtcbiAgICBcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBPYmplY3QuZW50cmllcyhwYXJhbXMpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIFN0cmluZyh2YWx1ZSkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiDluKbotoXml7bnmoTor7fmsYLmlrnms5VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdFdpdGhUaW1lb3V0KFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFJlcXVlc3RJbml0LFxuICAgIHRpbWVvdXQ6IG51bWJlclxuICApOiBQcm9taXNlPFJlc3BvbnNlPiB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbFxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEJsb2LovaxiYXNlNjRcbiAgICovXG4gIHByaXZhdGUgYmxvYlRvQmFzZTY0KGJsb2I6IEJsb2IpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZGVyLnJlc3VsdCBhcyBzdHJpbmc7XG4gICAgICAgIC8vIOenu+mZpGRhdGE6aW1hZ2UvLi4uO2Jhc2U2NCzliY3nvIBcbiAgICAgICAgY29uc3QgYmFzZTY0ID0gcmVzdWx0LnNwbGl0KCcsJylbMV07XG4gICAgICAgIHJlc29sdmUoYmFzZTY0KTtcbiAgICAgIH07XG4gICAgICByZWFkZXIub25lcnJvciA9IHJlamVjdDtcbiAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIOiHquWumuS5iUpTT07luo/liJfljJbvvIzpgb/lhY1Vbmljb2Rl6L2s5LmJXG4gICAqL1xuICBwcml2YXRlIHNlcmlhbGl6ZVdpdGhvdXRVbmljb2RlRXNjYXBlKGRhdGE6IGFueSk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOmmluWFiOWwneivleagh+WHhuW6j+WIl+WMllxuICAgICAgbGV0IGpzb24gPSBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAwKTtcbiAgICAgIFxuICAgICAgLy8g5aaC5p6c5Y+R546wVW5pY29kZei9rOS5ie+8jOi/m+ihjOi/mOWOn+W5tuiusOW9lVxuICAgICAgaWYgKC9cXFxcdVswLTlhLWZBLUZdezR9Ly50ZXN0KGpzb24pKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfwn5qoIEpTT07luo/liJfljJbkuK3lj5HnjrBVbmljb2Rl6L2s5LmJ77yM5q2j5Zyo6L+Y5Y6fLi4uJyk7XG4gICAgICAgIFxuICAgICAgICAvLyDlsIZVbmljb2Rl6L2s5LmJ5bqP5YiX6L+Y5Y6f5Li65Y6f5aeL5a2X56ymXG4gICAgICAgIGpzb24gPSBqc29uLnJlcGxhY2UoL1xcXFx1KFswLTlhLWZBLUZdezR9KS9nLCAobWF0Y2gsIGNvZGUpID0+IHtcbiAgICAgICAgICBjb25zdCBjaGFyID0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChjb2RlLCAxNikpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOi/mOWOnzogJHttYXRjaH0g4oaSICR7Y2hhcn1gKTtcbiAgICAgICAgICByZXR1cm4gY2hhcjtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn4pyFIFVuaWNvZGXovazkuYnlt7Lov5jljp8nKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIGpzb247XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDoh6rlrprkuYlKU09O5bqP5YiX5YyW5aSx6LSlOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAwKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==