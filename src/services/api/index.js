// Claude Code Update
/**
 * API模块统一入口
 * 提供所有API相关的类、类型和函数的统一导出
 */
// === 配置管理 ===
export { BACKEND_CONFIG, validateBackendConfig, getBackendConfigInfo, getApiEndpoint } from './backend-config';
// === HTTP客户端 ===
export { HttpClient } from './http-client';
// === 微信API ===
export { WechatClient } from './wechat-api';
import { BACKEND_CONFIG, getBackendConfigInfo } from './backend-config';
import { HttpClient } from './http-client';
import { WechatClient } from './wechat-api';
// === 全局实例管理 ===
let globalHttpClient = null;
let globalWechatClient = null;
/**
 * 初始化HTTP客户端
 * @param config HTTP客户端配置
 */
export function initHttpClient(config) {
    globalHttpClient = new HttpClient(config);
    console.log('🔧 全局HTTP客户端初始化成功');
}
/**
 * 初始化微信客户端
 * @param httpClient HTTP客户端实例（可选，如果未提供则使用全局实例）
 */
export function initWechatClient(httpClient) {
    if (!httpClient && !globalHttpClient) {
        throw new Error('HTTP客户端未初始化，请先调用 initHttpClient() 或传入 httpClient 参数');
    }
    globalWechatClient = new WechatClient(httpClient || globalHttpClient);
    console.log('🔧 全局微信客户端初始化成功');
}
/**
 * 获取全局HTTP客户端实例
 * @returns HTTP客户端实例
 */
export function getHttpClient() {
    if (!globalHttpClient) {
        throw new Error('HTTP客户端未初始化，请先调用 initHttpClient()');
    }
    return globalHttpClient;
}
/**
 * 获取全局微信客户端实例
 * @returns 微信客户端实例
 */
export function getWechatClient() {
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
export function shouldUseBackendProxy() {
    return BACKEND_CONFIG.USE_BACKEND_PROXY &&
        !!BACKEND_CONFIG.SERVER_URL &&
        !!BACKEND_CONFIG.API_KEY;
}
/**
 * 获取当前API模式描述
 * @returns API模式描述
 */
export function getApiMode() {
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
    async testBackendConnection() {
        try {
            const client = getWechatClient();
            return await client.healthCheck();
        }
        catch (error) {
            console.error('后端连接测试失败:', error);
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
export async function wxGetToken(appid, secret) {
    const client = getWechatClient();
    return await client.authenticate({ appId: appid, appSecret: secret });
}
/**
 * 上传图片到微信（兼容性函数的实际实现）
 */
export async function wxUploadImage(data, filename, token, type) {
    const client = getWechatClient();
    // Blob转base64
    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
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
export async function wxAddDraft(articles, token) {
    const client = getWechatClient();
    return await client.createDraft(articles, token);
}
// === 便捷初始化函数 ===
/**
 * 一键初始化API客户端
 * 使用默认配置初始化HTTP客户端和微信客户端
 */
export function initApiClients() {
    // 初始化HTTP客户端
    initHttpClient({
        baseUrl: BACKEND_CONFIG.SERVER_URL,
        apiKey: BACKEND_CONFIG.API_KEY,
        timeout: BACKEND_CONFIG.TIMEOUT,
        retries: BACKEND_CONFIG.MAX_RETRIES
    });
    // 初始化微信客户端
    initWechatClient();
    console.log('🎉 API客户端一键初始化完成');
}
// === 启动时日志 ===
console.log(`🔗 微信API模式: ${getApiMode()}`);
// === 别名函数（兼容性） ===
/**
 * 获取发布客户端（别名函数）
 * @returns 微信客户端实例
 */
export function getPublisherClient() {
    return getWechatClient();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQkFBcUI7QUFDckI7OztHQUdHO0FBRUgsZUFBZTtBQUNmLE9BQU8sRUFDTCxjQUFjLEVBQ2QscUJBQXFCLEVBQ3JCLG9CQUFvQixFQUNwQixjQUFjLEVBQ2YsTUFBTSxrQkFBa0IsQ0FBQztBQU8xQixrQkFBa0I7QUFDbEIsT0FBTyxFQUNMLFVBQVUsRUFDWCxNQUFNLGVBQWUsQ0FBQztBQVF2QixnQkFBZ0I7QUFDaEIsT0FBTyxFQUNMLFlBQVksRUFDYixNQUFNLGNBQWMsQ0FBQztBQWdCdEIsT0FBTyxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxVQUFVLEVBQW9CLE1BQU0sZUFBZSxDQUFDO0FBQzdELE9BQU8sRUFBRSxZQUFZLEVBQStELE1BQU0sY0FBYyxDQUFDO0FBRXpHLGlCQUFpQjtBQUNqQixJQUFJLGdCQUFnQixHQUFzQixJQUFJLENBQUM7QUFDL0MsSUFBSSxrQkFBa0IsR0FBd0IsSUFBSSxDQUFDO0FBRW5EOzs7R0FHRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsTUFBd0I7SUFDckQsZ0JBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsVUFBdUI7SUFDdEQsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1FBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztLQUN4RTtJQUVELGtCQUFrQixHQUFHLElBQUksWUFBWSxDQUFDLFVBQVUsSUFBSSxnQkFBaUIsQ0FBQyxDQUFDO0lBQ3ZFLE9BQU8sQ0FBQyxHQUFHLENB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Q0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENsYXVkZSBDb2RlIFVwZGF0ZVxuLyoqXG4gKiBBUEnmqKHlnZfnu5/kuIDlhaXlj6NcbiAqIOaPkOS+m+aJgOaciUFQSeebuOWFs+eahOexu+OAgeexu+Wei+WSjOWHveaVsOeahOe7n+S4gOWvvOWHulxuICovXG5cbi8vID09PSDphY3nva7nrqHnkIYgPT09XG5leHBvcnQge1xuICBCQUNLRU5EX0NPTkZJRyxcbiAgdmFsaWRhdGVCYWNrZW5kQ29uZmlnLFxuICBnZXRCYWNrZW5kQ29uZmlnSW5mbyxcbiAgZ2V0QXBpRW5kcG9pbnRcbn0gZnJvbSAnLi9iYWNrZW5kLWNvbmZpZyc7XG5cbmV4cG9ydCB0eXBlIHtcbiAgQmFja2VuZENvbmZpZ0luZm8sXG4gIENvbmZpZ1ZhbGlkYXRpb25SZXN1bHRcbn0gZnJvbSAnLi9iYWNrZW5kLWNvbmZpZyc7XG5cbi8vID09PSBIVFRQ5a6i5oi356uvID09PVxuZXhwb3J0IHtcbiAgSHR0cENsaWVudFxufSBmcm9tICcuL2h0dHAtY2xpZW50JztcblxuZXhwb3J0IHR5cGUge1xuICBBcGlSZXNwb25zZSxcbiAgSHR0cENsaWVudENvbmZpZyxcbiAgUmVxdWVzdE9wdGlvbnNcbn0gZnJvbSAnLi9odHRwLWNsaWVudCc7XG5cbi8vID09PSDlvq7kv6FBUEkgPT09XG5leHBvcnQge1xuICBXZWNoYXRDbGllbnRcbn0gZnJvbSAnLi93ZWNoYXQtYXBpJztcblxuZXhwb3J0IHR5cGUge1xuICBXZWNoYXRBdXRoLFxuICBXZWNoYXRUb2tlblJlc3BvbnNlLFxuICBNZWRpYVVwbG9hZCxcbiAgTWVkaWFSZXN1bHQsXG4gIERyYWZ0QXJ0aWNsZSxcbiAgRHJhZnRSZXN1bHQsXG4gIFB1Ymxpc2hSZXN1bHQsXG4gIE1lZGlhTGlzdFBhcmFtcyxcbiAgTWVkaWFMaXN0UmVzdWx0LFxuICBEcmFmdExpc3RSZXN1bHQsXG4gIFB1Ymxpc2hTdGF0dXNSZXN1bHRcbn0gZnJvbSAnLi93ZWNoYXQtYXBpJztcblxuaW1wb3J0IHsgQkFDS0VORF9DT05GSUcsIGdldEJhY2tlbmRDb25maWdJbmZvIH0gZnJvbSAnLi9iYWNrZW5kLWNvbmZpZyc7XG5pbXBvcnQgeyBIdHRwQ2xpZW50LCBIdHRwQ2xpZW50Q29uZmlnIH0gZnJvbSAnLi9odHRwLWNsaWVudCc7XG5pbXBvcnQgeyBXZWNoYXRDbGllbnQsIFdlY2hhdFRva2VuUmVzcG9uc2UsIE1lZGlhUmVzdWx0LCBEcmFmdEFydGljbGUsIERyYWZ0UmVzdWx0IH0gZnJvbSAnLi93ZWNoYXQtYXBpJztcblxuLy8gPT09IOWFqOWxgOWunuS+i+euoeeQhiA9PT1cbmxldCBnbG9iYWxIdHRwQ2xpZW50OiBIdHRwQ2xpZW50IHwgbnVsbCA9IG51bGw7XG5sZXQgZ2xvYmFsV2VjaGF0Q2xpZW50OiBXZWNoYXRDbGllbnQgfCBudWxsID0gbnVsbDtcblxuLyoqXG4gKiDliJ3lp4vljJZIVFRQ5a6i5oi356uvXG4gKiBAcGFyYW0gY29uZmlnIEhUVFDlrqLmiLfnq6/phY3nva5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRIdHRwQ2xpZW50KGNvbmZpZzogSHR0cENsaWVudENvbmZpZyk6IHZvaWQge1xuICBnbG9iYWxIdHRwQ2xpZW50ID0gbmV3IEh0dHBDbGllbnQoY29uZmlnKTtcbiAgY29uc29sZS5sb2coJ/CflKcg5YWo5bGASFRUUOWuouaIt+err+WIneWni+WMluaIkOWKnycpO1xufVxuXG4vKipcbiAqIOWIneWni+WMluW+ruS/oeWuouaIt+err1xuICogQHBhcmFtIGh0dHBDbGllbnQgSFRUUOWuouaIt+err+WunuS+i++8iOWPr+mAie+8jOWmguaenOacquaPkOS+m+WImeS9v+eUqOWFqOWxgOWunuS+i++8iVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFdlY2hhdENsaWVudChodHRwQ2xpZW50PzogSHR0cENsaWVudCk6IHZvaWQge1xuICBpZiAoIWh0dHBDbGllbnQgJiYgIWdsb2JhbEh0dHBDbGllbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0hUVFDlrqLmiLfnq6/mnKrliJ3lp4vljJbvvIzor7flhYjosIPnlKggaW5pdEh0dHBDbGllbnQoKSDmiJbkvKDlhaUgaHR0cENsaWVudCDlj4LmlbAnKTtcbiAgfVxuICBcbiAgZ2xvYmFsV2VjaGF0Q2xpZW50ID0gbmV3IFdlY2hhdENsaWVudChodHRwQ2xpZW50IHx8IGdsb2JhbEh0dHBDbGllbnQhKTtcbiAgY29uc29sZS5sb2coJ/CflKcg5YWo5bGA5b6u5L+h5a6i5oi356uv5Yid5aeL5YyW5oiQ5YqfJyk7XG59XG5cbi8qKlxuICog6I635Y+W5YWo5bGASFRUUOWuouaIt+err+WunuS+i1xuICogQHJldHVybnMgSFRUUOWuouaIt+err+WunuS+i1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SHR0cENsaWVudCgpOiBIdHRwQ2xpZW50IHtcbiAgaWYgKCFnbG9iYWxIdHRwQ2xpZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdIVFRQ5a6i5oi356uv5pyq5Yid5aeL5YyW77yM6K+35YWI6LCD55SoIGluaXRIdHRwQ2xpZW50KCknKTtcbiAgfVxuICByZXR1cm4gZ2xvYmFsSHR0cENsaWVudDtcbn1cblxuLyoqXG4gKiDojrflj5blhajlsYDlvq7kv6HlrqLmiLfnq6/lrp7kvotcbiAqIEByZXR1cm5zIOW+ruS/oeWuouaIt+err+WunuS+i1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2VjaGF0Q2xpZW50KCk6IFdlY2hhdENsaWVudCB7XG4gIGlmICghZ2xvYmFsV2VjaGF0Q2xpZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCflvq7kv6HlrqLmiLfnq6/mnKrliJ3lp4vljJbvvIzor7flhYjosIPnlKggaW5pdFdlY2hhdENsaWVudCgpJyk7XG4gIH1cbiAgcmV0dXJuIGdsb2JhbFdlY2hhdENsaWVudDtcbn1cblxuLy8gPT09IOW3peWFt+WHveaVsCA9PT1cblxuLyoqXG4gKiDmo4Dmn6XmmK/lkKblupTor6Xkvb/nlKjlkI7nq6/ku6PnkIbmqKHlvI9cbiAqIEByZXR1cm5zIOaYr+WQpuS9v+eUqOWQjuerr+S7o+eQhlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkVXNlQmFja2VuZFByb3h5KCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQkFDS0VORF9DT05GSUcuVVNFX0JBQ0tFTkRfUFJPWFkgJiYgXG4gICAgICAgICAhIUJBQ0tFTkRfQ09ORklHLlNFUlZFUl9VUkwgJiYgXG4gICAgICAgICAhIUJBQ0tFTkRfQ09ORklHLkFQSV9LRVk7XG59XG5cbi8qKlxuICog6I635Y+W5b2T5YmNQVBJ5qih5byP5o+P6L+wXG4gKiBAcmV0dXJucyBBUEnmqKHlvI/mj4/ov7BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEFwaU1vZGUoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNob3VsZFVzZUJhY2tlbmRQcm94eSgpIFxuICAgID8gJ+WQjuerr+S7o+eQhuaooeW8jycgXG4gICAgOiAn55u05o6l6LCD55So5qih5byPKOW3suW8g+eUqCknO1xufVxuXG4vLyA9PT0g6LCD6K+V5bel5YW3ID09PVxuZXhwb3J0IGNvbnN0IFdlY2hhdEFwaVV0aWxzID0ge1xuICAvKipcbiAgICog5qOA5p+l5piv5ZCm5L2/55So5ZCO56uv5Luj55CGXG4gICAqL1xuICBzaG91bGRVc2VCYWNrZW5kUHJveHksXG5cbiAgLyoqXG4gICAqIOiOt+WPlkFQSeaooeW8j+aPj+i/sFxuICAgKi9cbiAgZ2V0QXBpTW9kZSxcblxuICAvKipcbiAgICog5rWL6K+V5ZCO56uv6L+e5o6lXG4gICAqL1xuICBhc3luYyB0ZXN0QmFja2VuZENvbm5lY3Rpb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5oZWFsdGhDaGVjaygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCflkI7nq6/ov57mjqXmtYvor5XlpLHotKU6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICog6I635Y+W5b2T5YmN6YWN572u5L+h5oGvXG4gICAqL1xuICBnZXRDdXJyZW50Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwcm94eU1vZGU6IHNob3VsZFVzZUJhY2tlbmRQcm94eSgpLFxuICAgICAgc2VydmVyVXJsOiBCQUNLRU5EX0NPTkZJRy5TRVJWRVJfVVJMLFxuICAgICAgaGFzQXBpS2V5OiAhIUJBQ0tFTkRfQ09ORklHLkFQSV9LRVksXG4gICAgICBodHRwQ2xpZW50SW5pdGlhbGl6ZWQ6ICEhZ2xvYmFsSHR0cENsaWVudCxcbiAgICAgIHdlY2hhdENsaWVudEluaXRpYWxpemVkOiAhIWdsb2JhbFdlY2hhdENsaWVudCxcbiAgICAgIGNvbmZpZ0luZm86IGdldEJhY2tlbmRDb25maWdJbmZvKClcbiAgICB9O1xuICB9XG59O1xuXG4vLyA9PT0g5YW85a655oCn5Ye95pWw5a6e546wID09PVxuXG4vKipcbiAqIOiOt+WPluW+ruS/oVRva2Vu77yI5YW85a655oCn5Ye95pWw55qE5a6e6ZmF5a6e546w77yJXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3eEdldFRva2VuKGFwcGlkOiBzdHJpbmcsIHNlY3JldDogc3RyaW5nKTogUHJvbWlzZTxXZWNoYXRUb2tlblJlc3BvbnNlPiB7XG4gIGNvbnN0IGNsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuICByZXR1cm4gYXdhaXQgY2xpZW50LmF1dGhlbnRpY2F0ZSh7IGFwcElkOiBhcHBpZCwgYXBwU2VjcmV0OiBzZWNyZXQgfSk7XG59XG5cbi8qKlxuICog5LiK5Lyg5Zu+54mH5Yiw5b6u5L+h77yI5YW85a655oCn5Ye95pWw55qE5a6e6ZmF5a6e546w77yJXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3eFVwbG9hZEltYWdlKFxuICBkYXRhOiBCbG9iLCBcbiAgZmlsZW5hbWU6IHN0cmluZywgXG4gIHRva2VuOiBzdHJpbmcsIFxuICB0eXBlPzogc3RyaW5nXG4pOiBQcm9taXNlPE1lZGlhUmVzdWx0PiB7XG4gIGNvbnN0IGNsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuICBcbiAgLy8gQmxvYui9rGJhc2U2NFxuICBjb25zdCBiYXNlNjREYXRhID0gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gcmVhZGVyLnJlc3VsdCBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBiYXNlNjQgPSByZXN1bHQuc3BsaXQoJywnKVsxXTtcbiAgICAgIHJlc29sdmUoYmFzZTY0KTtcbiAgICB9O1xuICAgIHJlYWRlci5vbmVycm9yID0gcmVqZWN0O1xuICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGRhdGEpO1xuICB9KTtcblxuICByZXR1cm4gYXdhaXQgY2xpZW50LnVwbG9hZE1lZGlhKHtcbiAgICBtZWRpYURhdGE6IGJhc2U2NERhdGEsXG4gICAgZmlsZW5hbWUsXG4gICAgYWNjZXNzVG9rZW46IHRva2VuLFxuICAgIHN0b3JhZ2VUeXBlOiB0eXBlID09PSAnaW1hZ2UnID8gJ3Blcm1hbmVudCcgOiAndGVtcG9yYXJ5J1xuICB9KTtcbn1cblxuLyoqXG4gKiDmt7vliqDojYnnqL/vvIjlhbzlrrnmgKflh73mlbDnmoTlrp7pmYXlrp7njrDvvIlcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHd4QWRkRHJhZnQoYXJ0aWNsZXM6IERyYWZ0QXJ0aWNsZVtdLCB0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxEcmFmdFJlc3VsdD4ge1xuICBjb25zdCBjbGllbnQgPSBnZXRXZWNoYXRDbGllbnQoKTtcbiAgcmV0dXJuIGF3YWl0IGNsaWVudC5jcmVhdGVEcmFmdChhcnRpY2xlcywgdG9rZW4pO1xufVxuXG4vLyA9PT0g5L6/5o235Yid5aeL5YyW5Ye95pWwID09PVxuXG4vKipcbiAqIOS4gOmUruWIneWni+WMlkFQSeWuouaIt+err1xuICog5L2/55So6buY6K6k6YWN572u5Yid5aeL5YyWSFRUUOWuouaIt+err+WSjOW+ruS/oeWuouaIt+err1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFwaUNsaWVudHMoKTogdm9pZCB7XG4gIC8vIOWIneWni+WMlkhUVFDlrqLmiLfnq69cbiAgaW5pdEh0dHBDbGllbnQoe1xuICAgIGJhc2VVcmw6IEJBQ0tFTkRfQ09ORklHLlNFUlZFUl9VUkwsXG4gICAgYXBpS2V5OiBCQUNLRU5EX0NPTkZJRy5BUElfS0VZLFxuICAgIHRpbWVvdXQ6IEJBQ0tFTkRfQ09ORklHLlRJTUVPVVQsXG4gICAgcmV0cmllczogQkFDS0VORF9DT05GSUcuTUFYX1JFVFJJRVNcbiAgfSk7XG5cbiAgLy8g5Yid5aeL5YyW5b6u5L+h5a6i5oi356uvXG4gIGluaXRXZWNoYXRDbGllbnQoKTtcblxuICBjb25zb2xlLmxvZygn8J+OiSBBUEnlrqLmiLfnq6/kuIDplK7liJ3lp4vljJblrozmiJAnKTtcbn1cblxuLy8gPT09IOWQr+WKqOaXtuaXpeW/lyA9PT1cbmNvbnNvbGUubG9nKGDwn5SXIOW+ruS/oUFQSeaooeW8jzogJHtnZXRBcGlNb2RlKCl9YCk7XG5cbi8vID09PSDliKvlkI3lh73mlbDvvIjlhbzlrrnmgKfvvIkgPT09XG5cbi8qKlxuICog6I635Y+W5Y+R5biD5a6i5oi356uv77yI5Yir5ZCN5Ye95pWw77yJXG4gKiBAcmV0dXJucyDlvq7kv6HlrqLmiLfnq6/lrp7kvotcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFB1Ymxpc2hlckNsaWVudCgpOiBXZWNoYXRDbGllbnQge1xuICByZXR1cm4gZ2V0V2VjaGF0Q2xpZW50KCk7XG59XG5cbiJdfQ==