// Claude Code Update
/**
 * 微信API客户端模块
 * 提供微信公众号相关的所有API功能
 */
import { BACKEND_CONFIG } from './backend-config';
/**
 * 微信客户端类
 * 封装所有微信公众号API操作
 */
export class WechatClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
        if (BACKEND_CONFIG.DEBUG) {
            console.log('微信API客户端初始化完成');
        }
    }
    // === 认证相关方法 ===
    /**
     * 获取访问令牌
     */
    async authenticate(auth) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔐 正在获取微信访问令牌...');
        }
        // 添加调试信息
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 API请求参数:', {
                app_id: auth.appId,
                app_secret: `${auth.appSecret.substring(0, 8)}...${auth.appSecret.substring(auth.appSecret.length - 4)}`,
                app_secret_length: auth.appSecret.length
            });
        }
        const response = await this.httpClient.post('/api/v1/wechat/access-token', {
            app_id: auth.appId,
            app_secret: auth.appSecret
        });
        if (!response.success) {
            throw new Error(`获取访问令牌失败: ${response.error}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 微信访问令牌获取成功');
        }
        return response.data;
    }
    // === 媒体管理方法 ===
    /**
     * 上传媒体文件
     */
    async uploadMedia(upload) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`📤 正在上传媒体文件: ${upload.filename}`);
        }
        const requestData = {
            image_data: upload.mediaData,
            filename: upload.filename,
            access_token: upload.accessToken,
            type: upload.storageType === 'permanent' ? 'image' : undefined
        };
        const response = await this.httpClient.post('/api/v1/wechat/upload-image', requestData);
        if (!response.success) {
            console.error('❌ 媒体上传失败:', response.error);
            throw new Error(`媒体上传失败: ${response.error}`);
        }
        const result = response.data;
        if (result.errcode !== 0) {
            console.error('❌ 微信API返回错误:', result.errmsg);
            throw new Error(`微信API错误: ${result.errmsg}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 媒体上传成功, media_id:', result.media_id);
        }
        return result;
    }
    /**
     * 获取媒体列表
     */
    async getMediaList(params) {
        var _a;
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`📋 正在获取媒体列表: ${params.type}`);
        }
        // 修复API路径，使用正确的后端路由
        const response = await this.httpClient.post('/api/v1/wechat/batch-get-material', {
            type: params.type,
            offset: params.offset,
            count: params.count,
            access_token: params.accessToken
        });
        if (!response.success) {
            throw new Error(`获取媒体列表失败: ${response.error}`);
        }
        const result = response.data;
        // 修复错误判断逻辑，微信API成功响应可能没有errcode字段
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔍 素材库原始响应数据:', result);
        }
        // 只有当明确存在errcode且不为0时才认为是错误
        if (result.errcode !== undefined && result.errcode !== 0) {
            throw new Error(`微信API错误: ${result.errmsg || '未知错误'}`);
        }
        // 检查是否有实际的素材数据
        if (result.total_count === undefined) {
            throw new Error('微信API响应格式异常：缺少total_count字段');
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 媒体列表获取成功，总数:', result.total_count);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 项目数量:', result.item_count);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 实际项目:', ((_a = result.item) === null || _a === void 0 ? void 0 : _a.length) || 0);
        }
        return result;
    }
    // === 草稿管理方法 ===
    /**
     * 创建草稿
     */
    async createDraft(draft, accessToken) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`📝 正在创建草稿: ${draft.length} 篇文章`);
        }
        const response = await this.httpClient.post('/api/v1/wechat/create-draft', {
            articles: draft,
            access_token: accessToken
        });
        if (!response.success) {
            console.error('❌ 草稿创建失败:', response.error);
            throw new Error(`草稿创建失败: ${response.error}`);
        }
        const result = response.data;
        if (result.errcode !== 0) {
            console.error('❌ 微信API返回错误:', result.errmsg);
            throw new Error(`微信API错误: ${result.errmsg}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 草稿创建成功, media_id:', result.media_id);
        }
        return result;
    }
    /**
     * 更新草稿
     */
    async updateDraft(draftId, index, article, accessToken) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`📝 正在更新草稿: ${draftId}[${index}]`);
        }
        const response = await this.httpClient.put('/api/v1/wechat/update-draft', {
            media_id: draftId,
            index,
            article,
            access_token: accessToken
        });
        if (!response.success) {
            throw new Error(`草稿更新失败: ${response.error}`);
        }
        const result = response.data;
        if (result.errcode !== 0) {
            throw new Error(`微信API错误: ${result.errmsg}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 草稿更新成功');
        }
        return result;
    }
    /**
     * 删除草稿
     */
    async deleteDraft(draftId, index, accessToken) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`🗑️ 正在删除草稿: ${draftId}[${index}]`);
        }
        const response = await this.httpClient.delete('/api/v1/wechat/delete-draft', {
            media_id: draftId,
            index,
            access_token: accessToken
        });
        if (!response.success) {
            throw new Error(`草稿删除失败: ${response.error}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 草稿删除成功');
        }
        return response;
    }
    /**
     * 获取草稿列表
     */
    async getDraftList(accessToken, offset = 0, count = 20) {
        var _a;
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 正在获取草稿列表...');
        }
        const response = await this.httpClient.get('/api/v1/wechat/drafts', {
            access_token: accessToken,
            offset,
            count
        });
        if (!response.success) {
            throw new Error(`获取草稿列表失败: ${response.error}`);
        }
        const result = response.data;
        // 修复错误判断逻辑，微信API成功响应可能没有errcode字段
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔍 草稿列表原始响应数据:', result);
        }
        // 只有当明确存在errcode且不为0时才认为是错误
        if (result.errcode !== undefined && result.errcode !== 0) {
            throw new Error(`微信API错误: ${result.errmsg || '未知错误'}`);
        }
        // 检查是否有实际的草稿数据
        if (result.total_count === undefined) {
            throw new Error('微信API响应格式异常：缺少total_count字段');
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 草稿列表获取成功，总数:', result.total_count);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 草稿项目数量:', result.item_count);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📋 实际草稿:', ((_a = result.item) === null || _a === void 0 ? void 0 : _a.length) || 0);
        }
        return result;
    }
    // === 发布管理方法 ===
    /**
     * 发布内容
     */
    async publishContent(draftId, accessToken) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`🚀 正在发布内容: ${draftId}`);
        }
        const response = await this.httpClient.post('/api/v1/wechat/publish-draft', {
            media_id: draftId,
            access_token: accessToken
        });
        if (!response.success) {
            console.error('❌ 内容发布失败:', response.error);
            throw new Error(`内容发布失败: ${response.error}`);
        }
        const result = response.data;
        if (result.errcode !== 0) {
            console.error('❌ 微信API返回错误:', result.errmsg);
            throw new Error(`微信API错误: ${result.errmsg}`);
        }
        console.log('✅ 内容发布成功, publish_id:', result.publish_id);
        return result;
    }
    /**
     * 获取发布状态
     */
    async getPublishStatus(publishId, accessToken) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log(`📊 正在查询发布状态: ${publishId}`);
        }
        const response = await this.httpClient.post('/api/v1/wechat/publish-status', {
            publish_id: publishId,
            access_token: accessToken
        });
        if (!response.success) {
            throw new Error(`获取发布状态失败: ${response.error}`);
        }
        const result = response.data;
        if (result.errcode !== 0) {
            throw new Error(`微信API错误: ${result.errmsg}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 发布状态获取成功');
        }
        return result;
    }
    // === 辅助方法 ===
    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            const response = await this.httpClient.get('/api/v1/wechat/health');
            return response.success;
        }
        catch (_a) {
            return false;
        }
    }
    // Claude Code ADD: 新增账户管理方法
    /**
     * 验证AuthKey是否有效
     */
    async verifyAuthKey(authKey) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔑 验证AuthKey...');
        }
        const response = await this.httpClient.post('/api/v1/wechat/verify-auth-key', {
            auth_key: authKey
        });
        if (!response.success || !response.data) {
            throw new Error(`验证AuthKey失败: ${response.error || '未知错误'}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ AuthKey验证完成:', response.data);
        }
        return response.data;
    }
    /**
     * 注册或更新公众号账户
     */
    async registerAccount(request) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log('📝 注册公众号账户:', request.app_id);
        }
        const response = await this.httpClient.post('/api/v1/wechat/register-account', {
            app_id: request.app_id,
            app_secret: request.app_secret,
            name: request.name,
            auth_key: request.auth_key
        });
        if (!response.success) {
            throw new Error(`注册公众号失败: ${response.error}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 公众号账户注册成功');
        }
        return response;
    }
    /**
     * 检查公众号权限
     */
    async checkPermission(appId) {
        if (BACKEND_CONFIG.DEBUG) {
            console.log('🔍 检查公众号权限:', appId);
        }
        const response = await this.httpClient.get('/api/v1/wechat/check-permission', {
            app_id: appId
        });
        if (!response.success || !response.data) {
            throw new Error(`检查权限失败: ${response.error}`);
        }
        if (BACKEND_CONFIG.DEBUG) {
            console.log('✅ 权限检查完成:', response.data);
        }
        return response.data;
    }
}
// === 兼容性函数（向后兼容） ===
/**
 * 获取微信Token（兼容性函数）
 */
export async function wxGetToken(appid, secret) {
    // 这个函数需要全局的微信客户端实例，将在index.ts中实现
    throw new Error('请使用 getWechatClient().authenticate() 替代');
}
/**
 * 上传图片到微信（兼容性函数）
 */
export async function wxUploadImage(data, filename, token, type) {
    // 这个函数需要全局的微信客户端实例，将在index.ts中实现
    throw new Error('请使用 getWechatClient().uploadMedia() 替代');
}
/**
 * 添加草稿（兼容性函数）
 */
export async function wxAddDraft(articles, token) {
    // 这个函数需要全局的微信客户端实例，将在index.ts中实现
    throw new Error('请使用 getWechatClient().createDraft() 替代');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VjaGF0LWFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlY2hhdC1hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUJBQXFCO0FBQ3JCOzs7R0FHRztBQUdILE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQTZJbEQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLFlBQVk7SUFHdkIsWUFBWSxVQUFzQjtRQUNoQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7SUFFRCxpQkFBaUI7SUFFakI7O09BRUc7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLElBQWdCO1FBQ2pDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDakM7UUFFRCxTQUFTO1FBQ1QsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFO2dCQUN6QixNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2xCLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDeEcsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNO2FBQ3pDLENBQUMsQ0FBQztTQUNKO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBc0IsNkJBQTZCLEVBQUU7WUFDOUYsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2xCLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUztTQUMzQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDaEQ7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUM3QjtRQUNELE9BQU8sUUFBUSxDQUFDLElBQUssQ0FBQztJQUN4QixDQUFDO0lBRUQsaUJBQWlCO0lBRWpCOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFtQjtRQUNuQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDaEQ7UUFFRCxNQUFNLFdBQVcsR0FBRztZQUNsQixVQUFVLEVBQUUsTUFBTSxDQUFDLFNBQVM7WUFDNUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLFlBQVksRUFBRSxNQUFNLENBQUMsV0FBVztZQUNoQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFdBQVcsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUztTQUMvRCxDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBYyw2QkFBNkIsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVyRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUssQ0FBQztRQUU5QixJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckQ7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQXVCOztRQUN4QyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7U0FDNUM7UUFFRCxvQkFBb0I7UUFDcEIsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBa0IsbUNBQW1DLEVBQUU7WUFDaEcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO1lBQ2pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtZQUNyQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbkIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxXQUFXO1NBQ2pDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUNoRDtRQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFLLENBQUM7UUFFOUIsa0NBQWtDO1FBQ2xDLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN0QztRQUVELDRCQUE0QjtRQUM1QixJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDeEQ7UUFFRCxlQUFlO1FBQ2YsSUFBSSxNQUFNLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUEsTUFBQSxNQUFNLENBQUMsSUFBSSwwQ0FBRSxNQUFNLEtBQUksQ0FBQyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsaUJBQWlCO0lBRWpCOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFxQixFQUFFLFdBQW1CO1FBQzFELElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsS0FBSyxDQUFDLE1BQU0sTUFBTSxDQUFDLENBQUM7U0FDL0M7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFjLDZCQUE2QixFQUFFO1lBQ3RGLFFBQVEsRUFBRSxLQUFLO1lBQ2YsWUFBWSxFQUFFLFdBQVc7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUM5QztRQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFLLENBQUM7UUFFOUIsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3JEO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FDZixPQUFlLEVBQ2YsS0FBYSxFQUNiLE9BQXFCLEVBQ3JCLFdBQW1CO1FBRW5CLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsT0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7U0FDaEQ7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFjLDZCQUE2QixFQUFFO1lBQ3JGLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLEtBQUs7WUFDTCxPQUFPO1lBQ1AsWUFBWSxFQUFFLFdBQVc7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUssQ0FBQztRQUU5QixJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztTQUM5QztRQUVELElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFlLEVBQUUsS0FBYSxFQUFFLFdBQW1CO1FBQ25FLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsT0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7U0FDakQ7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLDZCQUE2QixFQUFFO1lBQzNFLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLEtBQUs7WUFDTCxZQUFZLEVBQUUsV0FBVztTQUMxQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6QjtRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsV0FBbUIsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFOztRQUM1RCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQy9CO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBa0IsdUJBQXVCLEVBQUU7WUFDbkYsWUFBWSxFQUFFLFdBQVc7WUFDekIsTUFBTTtZQUNOLEtBQUs7U0FDTixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDaEQ7UUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSyxDQUFDO1FBRTlCLGtDQUFrQztRQUNsQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN2QztRQUVELDRCQUE0QjtRQUM1QixJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ3hELE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDeEQ7UUFFRCxlQUFlO1FBQ2YsSUFBSSxNQUFNLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDaEQ7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUEsTUFBQSxNQUFNLENBQUMsSUFBSSwwQ0FBRSxNQUFNLEtBQUksQ0FBQyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsaUJBQWlCO0lBRWpCOztPQUVHO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFlLEVBQUUsV0FBbUI7UUFDdkQsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBZ0IsOEJBQThCLEVBQUU7WUFDekYsUUFBUSxFQUFFLE9BQU87WUFDakIsWUFBWSxFQUFFLFdBQVc7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7WUFDckIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUM5QztRQUVELE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFLLENBQUM7UUFFOUIsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQUMsRUFBRTtZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQWlCLEVBQUUsV0FBbUI7UUFDM0QsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLFNBQVMsRUFBRSxDQUFDLENBQUM7U0FDMUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFzQiwrQkFBK0IsRUFBRTtZQUNoRyxVQUFVLEVBQUUsU0FBUztZQUNyQixZQUFZLEVBQUUsV0FBVztTQUMxQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDaEQ7UUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSyxDQUFDO1FBRTlCLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFDLEVBQUU7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBRUQsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDM0I7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsZUFBZTtJQUVmOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVc7UUFDZixJQUFJO1lBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQztTQUN6QjtRQUFDLFdBQU07WUFDTixPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUVELDRCQUE0QjtJQUU1Qjs7T0FFRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBZTtRQUNqQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBd0IsZ0NBQWdDLEVBQUU7WUFDbkcsUUFBUSxFQUFFLE9BQU87U0FDbEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLFFBQVEsQ0FBQyxLQUFLLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQztTQUM3RDtRQUVELElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QztRQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztJQUN2QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQStCO1FBQ25ELElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxFQUFFO1lBQzdFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtZQUN0QixVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7WUFDOUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtTQUMzQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDL0M7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUM1QjtRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBYTtRQUNqQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFpQixpQ0FBaUMsRUFBRTtZQUM1RixNQUFNLEVBQUUsS0FBSztTQUNkLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pDO1FBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQUVELHNCQUFzQjtBQUV0Qjs7R0FFRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsVUFBVSxDQUFDLEtBQWEsRUFBRSxNQUFjO0lBQzVELGlDQUFpQztJQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxhQUFhLENBQ2pDLElBQVUsRUFDVixRQUFnQixFQUNoQixLQUFhLEVBQ2IsSUFBYTtJQUViLGlDQUFpQztJQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxVQUFVLENBQUMsUUFBd0IsRUFBRSxLQUFhO0lBQ3RFLGlDQUFpQztJQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7QUFDNUQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENsYXVkZSBDb2RlIFVwZGF0ZVxuLyoqXG4gKiDlvq7kv6FBUEnlrqLmiLfnq6/mqKHlnZdcbiAqIOaPkOS+m+W+ruS/oeWFrOS8l+WPt+ebuOWFs+eahOaJgOaciUFQSeWKn+iDvVxuICovXG5cbmltcG9ydCB7IEh0dHBDbGllbnQsIEFwaVJlc3BvbnNlIH0gZnJvbSAnLi9odHRwLWNsaWVudCc7XG5pbXBvcnQgeyBCQUNLRU5EX0NPTkZJRyB9IGZyb20gJy4vYmFja2VuZC1jb25maWcnO1xuXG4vLyA9PT0g5b6u5L+h55u45YWz57G75Z6L5a6a5LmJID09PVxuZXhwb3J0IGludGVyZmFjZSBXZWNoYXRBdXRoIHtcbiAgYXBwSWQ6IHN0cmluZztcbiAgYXBwU2VjcmV0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2VjaGF0VG9rZW5SZXNwb25zZSB7XG4gIGFjY2Vzc190b2tlbjogc3RyaW5nO1xuICBleHBpcmVzX2luOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVkaWFVcGxvYWQge1xuICBtZWRpYURhdGE6IHN0cmluZzsgLy8gYmFzZTY057yW56CB55qE5aqS5L2T5pWw5o2uXG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIGFjY2Vzc1Rva2VuOiBzdHJpbmc7XG4gIG1lZGlhVHlwZT86ICdpbWFnZScgfCAndmlkZW8nIHwgJ2F1ZGlvJzsgLy8g5aqS5L2T57G75Z6LXG4gIHN0b3JhZ2VUeXBlPzogJ3RlbXBvcmFyeScgfCAncGVybWFuZW50JzsgLy8g5a2Y5YKo57G75Z6LXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVkaWFSZXN1bHQge1xuICBlcnJjb2RlOiBudW1iZXI7XG4gIGVycm1zZz86IHN0cmluZztcbiAgbWVkaWFfaWQ/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEcmFmdEFydGljbGUge1xuICB0aXRsZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIGF1dGhvcj86IHN0cmluZztcbiAgZGlnZXN0Pzogc3RyaW5nO1xuICBjb250ZW50X3NvdXJjZV91cmw/OiBzdHJpbmc7XG4gIHRodW1iX21lZGlhX2lkPzogc3RyaW5nO1xuICBzaG93X2NvdmVyX3BpYz86IGJvb2xlYW47XG4gIG5lZWRfb3Blbl9jb21tZW50PzogYm9vbGVhbjtcbiAgb25seV9mYW5zX2Nhbl9jb21tZW50PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEcmFmdFJlc3VsdCB7XG4gIGVycmNvZGU6IG51bWJlcjtcbiAgZXJybXNnPzogc3RyaW5nO1xuICBtZWRpYV9pZD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQdWJsaXNoUmVzdWx0IHtcbiAgZXJyY29kZTogbnVtYmVyO1xuICBlcnJtc2c/OiBzdHJpbmc7XG4gIHB1Ymxpc2hfaWQ/OiBzdHJpbmc7XG4gIG1zZ19pZD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZWRpYUxpc3RQYXJhbXMge1xuICB0eXBlOiBzdHJpbmc7XG4gIG9mZnNldDogbnVtYmVyO1xuICBjb3VudDogbnVtYmVyO1xuICBhY2Nlc3NUb2tlbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lZGlhTGlzdFJlc3VsdCB7XG4gIGVycmNvZGU6IG51bWJlcjtcbiAgZXJybXNnPzogc3RyaW5nO1xuICB0b3RhbF9jb3VudD86IG51bWJlcjtcbiAgaXRlbV9jb3VudD86IG51bWJlcjtcbiAgaXRlbT86IEFycmF5PHtcbiAgICBtZWRpYV9pZDogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgdXBkYXRlX3RpbWU/OiBudW1iZXI7XG4gICAgdXJsPzogc3RyaW5nO1xuICB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEcmFmdExpc3RSZXN1bHQge1xuICBlcnJjb2RlOiBudW1iZXI7XG4gIGVycm1zZz86IHN0cmluZztcbiAgdG90YWxfY291bnQ/OiBudW1iZXI7XG4gIGl0ZW1fY291bnQ/OiBudW1iZXI7XG4gIGl0ZW0/OiBBcnJheTx7XG4gICAgbWVkaWFfaWQ6IHN0cmluZztcbiAgICBjb250ZW50Pzoge1xuICAgICAgbmV3c19pdGVtOiBBcnJheTx7XG4gICAgICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgICAgIGF1dGhvcjogc3RyaW5nO1xuICAgICAgICBkaWdlc3Q6IHN0cmluZztcbiAgICAgICAgY29udGVudDogc3RyaW5nO1xuICAgICAgICBjb250ZW50X3NvdXJjZV91cmw6IHN0cmluZztcbiAgICAgICAgdGh1bWJfbWVkaWFfaWQ6IHN0cmluZztcbiAgICAgICAgc2hvd19jb3Zlcl9waWM6IG51bWJlcjtcbiAgICAgICAgbmVlZF9vcGVuX2NvbW1lbnQ6IG51bWJlcjtcbiAgICAgICAgb25seV9mYW5zX2Nhbl9jb21tZW50OiBudW1iZXI7XG4gICAgICB9PjtcbiAgICB9O1xuICAgIHVwZGF0ZV90aW1lPzogbnVtYmVyO1xuICB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQdWJsaXNoU3RhdHVzUmVzdWx0IHtcbiAgZXJyY29kZTogbnVtYmVyO1xuICBlcnJtc2c/OiBzdHJpbmc7XG4gIHB1Ymxpc2hfc3RhdHVzPzogbnVtYmVyOyAvLyAwOuaIkOWKnywgMTrlj5HluIPkuK0sIDI65Y6f5Yib5aSx6LSlLCAzOuW4uOinhOWksei0pSwgNDrlubPlj7DlrqHmoLjkuI3pgJrov4csIDU65oiQ5Yqf5ZCO55So5oi35Yig6Zmk5omA5pyJ5paH56ugXG4gIGFydGljbGVfaWQ/OiBzdHJpbmc7XG4gIGFydGljbGVfdXJsPzogc3RyaW5nO1xuICBmYWlsX2lkeD86IG51bWJlcltdO1xufVxuXG4vLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinuexu+Wei+WumuS5iVxuZXhwb3J0IGludGVyZmFjZSBSZWdpc3RlckFjY291bnRSZXF1ZXN0IHtcbiAgYXBwX2lkOiBzdHJpbmc7XG4gIGFwcF9zZWNyZXQ6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBhdXRoX2tleTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlcmlmeUF1dGhLZXlSZXNwb25zZSB7XG4gIGlzX3ZhbGlkOiBib29sZWFuO1xuICBpc192aXA6IGJvb2xlYW47XG4gIGV4cGlyZWRfYXQ/OiBzdHJpbmc7XG4gIG1heF9hY2NvdW50czogbnVtYmVyO1xuICByZWdpc3RlcmVkX2FjY291bnRzOiBudW1iZXI7XG4gIGNhbl9yZWdpc3RlcjogYm9vbGVhbjtcbiAgbWVzc2FnZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBlcm1pc3Npb25GZWF0dXJlcyB7XG4gIHVwbG9hZF9pbWFnZTogYm9vbGVhbjtcbiAgY3JlYXRlX2RyYWZ0OiBib29sZWFuO1xuICBhZHZhbmNlZF9mZWF0dXJlczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQZXJtaXNzaW9uSW5mbyB7XG4gIGFwcF9pZDogc3RyaW5nO1xuICBuYW1lPzogc3RyaW5nO1xuICBpc192aXA6IGJvb2xlYW47XG4gIGlzX3JlZ2lzdGVyZWQ/OiBib29sZWFuO1xuICBleHBpcmVkX2F0Pzogc3RyaW5nO1xuICBjYW5fdXNlX2FwaTogYm9vbGVhbjtcbiAgbWVzc2FnZT86IHN0cmluZztcbiAgZmVhdHVyZXM/OiBQZXJtaXNzaW9uRmVhdHVyZXM7XG59XG5cbi8qKlxuICog5b6u5L+h5a6i5oi356uv57G7XG4gKiDlsIHoo4XmiYDmnInlvq7kv6HlhazkvJflj7dBUEnmk43kvZxcbiAqL1xuZXhwb3J0IGNsYXNzIFdlY2hhdENsaWVudCB7XG4gIHByaXZhdGUgaHR0cENsaWVudDogSHR0cENsaWVudDtcblxuICBjb25zdHJ1Y3RvcihodHRwQ2xpZW50OiBIdHRwQ2xpZW50KSB7XG4gICAgdGhpcy5odHRwQ2xpZW50ID0gaHR0cENsaWVudDtcbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCflvq7kv6FBUEnlrqLmiLfnq6/liJ3lp4vljJblrozmiJAnKTtcbiAgICB9XG4gIH1cblxuICAvLyA9PT0g6K6k6K+B55u45YWz5pa55rOVID09PVxuICBcbiAgLyoqXG4gICAqIOiOt+WPluiuv+mXruS7pOeJjFxuICAgKi9cbiAgYXN5bmMgYXV0aGVudGljYXRlKGF1dGg6IFdlY2hhdEF1dGgpOiBQcm9taXNlPFdlY2hhdFRva2VuUmVzcG9uc2U+IHtcbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SQIOato+WcqOiOt+WPluW+ruS/oeiuv+mXruS7pOeJjC4uLicpO1xuICAgIH1cbiAgICBcbiAgICAvLyDmt7vliqDosIPor5Xkv6Hmga9cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIEFQSeivt+axguWPguaVsDonLCB7XG4gICAgICAgIGFwcF9pZDogYXV0aC5hcHBJZCxcbiAgICAgICAgYXBwX3NlY3JldDogYCR7YXV0aC5hcHBTZWNyZXQuc3Vic3RyaW5nKDAsIDgpfS4uLiR7YXV0aC5hcHBTZWNyZXQuc3Vic3RyaW5nKGF1dGguYXBwU2VjcmV0Lmxlbmd0aCAtIDQpfWAsXG4gICAgICAgIGFwcF9zZWNyZXRfbGVuZ3RoOiBhdXRoLmFwcFNlY3JldC5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaHR0cENsaWVudC5wb3N0PFdlY2hhdFRva2VuUmVzcG9uc2U+KCcvYXBpL3YxL3dlY2hhdC9hY2Nlc3MtdG9rZW4nLCB7XG4gICAgICBhcHBfaWQ6IGF1dGguYXBwSWQsXG4gICAgICBhcHBfc2VjcmV0OiBhdXRoLmFwcFNlY3JldFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOiOt+WPluiuv+mXruS7pOeJjOWksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5b6u5L+h6K6/6Zeu5Luk54mM6I635Y+W5oiQ5YqfJyk7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhITtcbiAgfVxuXG4gIC8vID09PSDlqpLkvZPnrqHnkIbmlrnms5UgPT09XG4gIFxuICAvKipcbiAgICog5LiK5Lyg5aqS5L2T5paH5Lu2XG4gICAqL1xuICBhc3luYyB1cGxvYWRNZWRpYSh1cGxvYWQ6IE1lZGlhVXBsb2FkKTogUHJvbWlzZTxNZWRpYVJlc3VsdD4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coYPCfk6Qg5q2j5Zyo5LiK5Lyg5aqS5L2T5paH5Lu2OiAke3VwbG9hZC5maWxlbmFtZX1gKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVxdWVzdERhdGEgPSB7XG4gICAgICBpbWFnZV9kYXRhOiB1cGxvYWQubWVkaWFEYXRhLFxuICAgICAgZmlsZW5hbWU6IHVwbG9hZC5maWxlbmFtZSxcbiAgICAgIGFjY2Vzc190b2tlbjogdXBsb2FkLmFjY2Vzc1Rva2VuLFxuICAgICAgdHlwZTogdXBsb2FkLnN0b3JhZ2VUeXBlID09PSAncGVybWFuZW50JyA/ICdpbWFnZScgOiB1bmRlZmluZWRcbiAgICB9O1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHBDbGllbnQucG9zdDxNZWRpYVJlc3VsdD4oJy9hcGkvdjEvd2VjaGF0L3VwbG9hZC1pbWFnZScsIHJlcXVlc3REYXRhKTtcblxuICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWqkuS9k+S4iuS8oOWksei0pTonLCByZXNwb25zZS5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOWqkuS9k+S4iuS8oOWksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhITtcbiAgICBcbiAgICBpZiAocmVzdWx0LmVycmNvZGUgIT09IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlvq7kv6FBUEnov5Tlm57plJnor686JywgcmVzdWx0LmVycm1zZyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOW+ruS/oUFQSemUmeivrzogJHtyZXN1bHQuZXJybXNnfWApO1xuICAgIH1cblxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ+KchSDlqpLkvZPkuIrkvKDmiJDlip8sIG1lZGlhX2lkOicsIHJlc3VsdC5tZWRpYV9pZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICog6I635Y+W5aqS5L2T5YiX6KGoXG4gICAqL1xuICBhc3luYyBnZXRNZWRpYUxpc3QocGFyYW1zOiBNZWRpYUxpc3RQYXJhbXMpOiBQcm9taXNlPE1lZGlhTGlzdFJlc3VsdD4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coYPCfk4sg5q2j5Zyo6I635Y+W5aqS5L2T5YiX6KGoOiAke3BhcmFtcy50eXBlfWApO1xuICAgIH1cbiAgICBcbiAgICAvLyDkv67lpI1BUEnot6/lvoTvvIzkvb/nlKjmraPnoa7nmoTlkI7nq6/ot6/nlLFcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaHR0cENsaWVudC5wb3N0PE1lZGlhTGlzdFJlc3VsdD4oJy9hcGkvdjEvd2VjaGF0L2JhdGNoLWdldC1tYXRlcmlhbCcsIHtcbiAgICAgIHR5cGU6IHBhcmFtcy50eXBlLFxuICAgICAgb2Zmc2V0OiBwYXJhbXMub2Zmc2V0LFxuICAgICAgY291bnQ6IHBhcmFtcy5jb3VudCxcbiAgICAgIGFjY2Vzc190b2tlbjogcGFyYW1zLmFjY2Vzc1Rva2VuXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg6I635Y+W5aqS5L2T5YiX6KGo5aSx6LSlOiAke3Jlc3BvbnNlLmVycm9yfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHJlc3BvbnNlLmRhdGEhO1xuICAgIFxuICAgIC8vIOS/ruWkjemUmeivr+WIpOaWremAu+i+ke+8jOW+ruS/oUFQSeaIkOWKn+WTjeW6lOWPr+iDveayoeaciWVycmNvZGXlrZfmrrVcbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SNIOe0oOadkOW6k+WOn+Wni+WTjeW6lOaVsOaNrjonLCByZXN1bHQpO1xuICAgIH1cbiAgICBcbiAgICAvLyDlj6rmnInlvZPmmI7noa7lrZjlnKhlcnJjb2Rl5LiU5LiN5Li6MOaXtuaJjeiupOS4uuaYr+mUmeivr1xuICAgIGlmIChyZXN1bHQuZXJyY29kZSAhPT0gdW5kZWZpbmVkICYmIHJlc3VsdC5lcnJjb2RlICE9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOW+ruS/oUFQSemUmeivrzogJHtyZXN1bHQuZXJybXNnIHx8ICfmnKrnn6XplJnor68nfWApO1xuICAgIH1cbiAgICBcbiAgICAvLyDmo4Dmn6XmmK/lkKbmnInlrp7pmYXnmoTntKDmnZDmlbDmja5cbiAgICBpZiAocmVzdWx0LnRvdGFsX2NvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign5b6u5L+hQVBJ5ZON5bqU5qC85byP5byC5bi477ya57y65bCRdG90YWxfY291bnTlrZfmrrUnKTtcbiAgICB9XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5aqS5L2T5YiX6KGo6I635Y+W5oiQ5Yqf77yM5oC75pWwOicsIHJlc3VsdC50b3RhbF9jb3VudCk7XG4gICAgfVxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4sg6aG555uu5pWw6YePOicsIHJlc3VsdC5pdGVtX2NvdW50KTtcbiAgICB9XG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+TiyDlrp7pmYXpobnnm646JywgcmVzdWx0Lml0ZW0/Lmxlbmd0aCB8fCAwKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vID09PSDojYnnqL/nrqHnkIbmlrnms5UgPT09XG4gIFxuICAvKipcbiAgICog5Yib5bu66I2J56i/XG4gICAqL1xuICBhc3luYyBjcmVhdGVEcmFmdChkcmFmdDogRHJhZnRBcnRpY2xlW10sIGFjY2Vzc1Rva2VuOiBzdHJpbmcpOiBQcm9taXNlPERyYWZ0UmVzdWx0PiB7XG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+TnSDmraPlnKjliJvlu7rojYnnqL86ICR7ZHJhZnQubGVuZ3RofSDnr4fmlofnq6BgKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHBDbGllbnQucG9zdDxEcmFmdFJlc3VsdD4oJy9hcGkvdjEvd2VjaGF0L2NyZWF0ZS1kcmFmdCcsIHtcbiAgICAgIGFydGljbGVzOiBkcmFmdCxcbiAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW5cbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOiNieeov+WIm+W7uuWksei0pTonLCByZXNwb25zZS5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOiNieeov+WIm+W7uuWksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhITtcbiAgICBcbiAgICBpZiAocmVzdWx0LmVycmNvZGUgIT09IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlvq7kv6FBUEnov5Tlm57plJnor686JywgcmVzdWx0LmVycm1zZyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOW+ruS/oUFQSemUmeivrzogJHtyZXN1bHQuZXJybXNnfWApO1xuICAgIH1cblxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ+KchSDojYnnqL/liJvlu7rmiJDlip8sIG1lZGlhX2lkOicsIHJlc3VsdC5tZWRpYV9pZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICog5pu05paw6I2J56i/XG4gICAqL1xuICBhc3luYyB1cGRhdGVEcmFmdChcbiAgICBkcmFmdElkOiBzdHJpbmcsIFxuICAgIGluZGV4OiBudW1iZXIsIFxuICAgIGFydGljbGU6IERyYWZ0QXJ0aWNsZSwgXG4gICAgYWNjZXNzVG9rZW46IHN0cmluZ1xuICApOiBQcm9taXNlPERyYWZ0UmVzdWx0PiB7XG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZyhg8J+TnSDmraPlnKjmm7TmlrDojYnnqL86ICR7ZHJhZnRJZH1bJHtpbmRleH1dYCk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LnB1dDxEcmFmdFJlc3VsdD4oJy9hcGkvdjEvd2VjaGF0L3VwZGF0ZS1kcmFmdCcsIHtcbiAgICAgIG1lZGlhX2lkOiBkcmFmdElkLFxuICAgICAgaW5kZXgsXG4gICAgICBhcnRpY2xlLFxuICAgICAgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlblxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOiNieeov+abtOaWsOWksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhITtcbiAgICBcbiAgICBpZiAocmVzdWx0LmVycmNvZGUgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg5b6u5L+hQVBJ6ZSZ6K+vOiAke3Jlc3VsdC5lcnJtc2d9YCk7XG4gICAgfVxuXG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pyFIOiNieeov+abtOaWsOaIkOWKnycpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIOWIoOmZpOiNieeov1xuICAgKi9cbiAgYXN5bmMgZGVsZXRlRHJhZnQoZHJhZnRJZDogc3RyaW5nLCBpbmRleDogbnVtYmVyLCBhY2Nlc3NUb2tlbjogc3RyaW5nKTogUHJvbWlzZTxBcGlSZXNwb25zZT4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coYPCfl5HvuI8g5q2j5Zyo5Yig6Zmk6I2J56i/OiAke2RyYWZ0SWR9WyR7aW5kZXh9XWApO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaHR0cENsaWVudC5kZWxldGUoJy9hcGkvdjEvd2VjaGF0L2RlbGV0ZS1kcmFmdCcsIHtcbiAgICAgIG1lZGlhX2lkOiBkcmFmdElkLFxuICAgICAgaW5kZXgsXG4gICAgICBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg6I2J56i/5Yig6Zmk5aSx6LSlOiAke3Jlc3BvbnNlLmVycm9yfWApO1xuICAgIH1cblxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ+KchSDojYnnqL/liKDpmaTmiJDlip8nKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluiNieeov+WIl+ihqFxuICAgKi9cbiAgYXN5bmMgZ2V0RHJhZnRMaXN0KGFjY2Vzc1Rva2VuOiBzdHJpbmcsIG9mZnNldCA9IDAsIGNvdW50ID0gMjApOiBQcm9taXNlPERyYWZ0TGlzdFJlc3VsdD4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ/Cfk4sg5q2j5Zyo6I635Y+W6I2J56i/5YiX6KGoLi4uJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LmdldDxEcmFmdExpc3RSZXN1bHQ+KCcvYXBpL3YxL3dlY2hhdC9kcmFmdHMnLCB7XG4gICAgICBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuLFxuICAgICAgb2Zmc2V0LFxuICAgICAgY291bnRcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDojrflj5bojYnnqL/liJfooajlpLHotKU6ICR7cmVzcG9uc2UuZXJyb3J9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gcmVzcG9uc2UuZGF0YSE7XG4gICAgXG4gICAgLy8g5L+u5aSN6ZSZ6K+v5Yik5pat6YC76L6R77yM5b6u5L+hQVBJ5oiQ5Yqf5ZON5bqU5Y+v6IO95rKh5pyJZXJyY29kZeWtl+autVxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ/CflI0g6I2J56i/5YiX6KGo5Y6f5aeL5ZON5bqU5pWw5o2uOicsIHJlc3VsdCk7XG4gICAgfVxuICAgIFxuICAgIC8vIOWPquacieW9k+aYjuehruWtmOWcqGVycmNvZGXkuJTkuI3kuLow5pe25omN6K6k5Li65piv6ZSZ6K+vXG4gICAgaWYgKHJlc3VsdC5lcnJjb2RlICE9PSB1bmRlZmluZWQgJiYgcmVzdWx0LmVycmNvZGUgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg5b6u5L+hQVBJ6ZSZ6K+vOiAke3Jlc3VsdC5lcnJtc2cgfHwgJ+acquefpemUmeivryd9YCk7XG4gICAgfVxuICAgIFxuICAgIC8vIOajgOafpeaYr+WQpuacieWunumZheeahOiNieeov+aVsOaNrlxuICAgIGlmIChyZXN1bHQudG90YWxfY291bnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCflvq7kv6FBUEnlk43lupTmoLzlvI/lvILluLjvvJrnvLrlsJF0b3RhbF9jb3VudOWtl+autScpO1xuICAgIH1cblxuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ+KchSDojYnnqL/liJfooajojrflj5bmiJDlip/vvIzmgLvmlbA6JywgcmVzdWx0LnRvdGFsX2NvdW50KTtcbiAgICB9XG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+TiyDojYnnqL/pobnnm67mlbDph486JywgcmVzdWx0Lml0ZW1fY291bnQpO1xuICAgIH1cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OLIOWunumZheiNieeovzonLCByZXN1bHQuaXRlbT8ubGVuZ3RoIHx8IDApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gPT09IOWPkeW4g+euoeeQhuaWueazlSA9PT1cbiAgXG4gIC8qKlxuICAgKiDlj5HluIPlhoXlrrlcbiAgICovXG4gIGFzeW5jIHB1Ymxpc2hDb250ZW50KGRyYWZ0SWQ6IHN0cmluZywgYWNjZXNzVG9rZW46IHN0cmluZyk6IFByb21pc2U8UHVibGlzaFJlc3VsdD4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coYPCfmoAg5q2j5Zyo5Y+R5biD5YaF5a65OiAke2RyYWZ0SWR9YCk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LnBvc3Q8UHVibGlzaFJlc3VsdD4oJy9hcGkvdjEvd2VjaGF0L3B1Ymxpc2gtZHJhZnQnLCB7XG4gICAgICBtZWRpYV9pZDogZHJhZnRJZCxcbiAgICAgIGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW5cbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xuICAgICAgY29uc29sZS5lcnJvcign4p2MIOWGheWuueWPkeW4g+Wksei0pTonLCByZXNwb25zZS5lcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOWGheWuueWPkeW4g+Wksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5kYXRhITtcbiAgICBcbiAgICBpZiAocmVzdWx0LmVycmNvZGUgIT09IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCDlvq7kv6FBUEnov5Tlm57plJnor686JywgcmVzdWx0LmVycm1zZyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOW+ruS/oUFQSemUmeivrzogJHtyZXN1bHQuZXJybXNnfWApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUg5YaF5a655Y+R5biD5oiQ5YqfLCBwdWJsaXNoX2lkOicsIHJlc3VsdC5wdWJsaXNoX2lkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluWPkeW4g+eKtuaAgVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGlzaFN0YXR1cyhwdWJsaXNoSWQ6IHN0cmluZywgYWNjZXNzVG9rZW46IHN0cmluZyk6IFByb21pc2U8UHVibGlzaFN0YXR1c1Jlc3VsdD4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coYPCfk4og5q2j5Zyo5p+l6K+i5Y+R5biD54q25oCBOiAke3B1Ymxpc2hJZH1gKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHBDbGllbnQucG9zdDxQdWJsaXNoU3RhdHVzUmVzdWx0PignL2FwaS92MS93ZWNoYXQvcHVibGlzaC1zdGF0dXMnLCB7XG4gICAgICBwdWJsaXNoX2lkOiBwdWJsaXNoSWQsXG4gICAgICBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuXG4gICAgfSk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg6I635Y+W5Y+R5biD54q25oCB5aSx6LSlOiAke3Jlc3BvbnNlLmVycm9yfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3VsdCA9IHJlc3BvbnNlLmRhdGEhO1xuICAgIFxuICAgIGlmIChyZXN1bHQuZXJyY29kZSAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDlvq7kv6FBUEnplJnor686ICR7cmVzdWx0LmVycm1zZ31gKTtcbiAgICB9XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5Y+R5biD54q25oCB6I635Y+W5oiQ5YqfJyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyA9PT0g6L6F5Yqp5pa55rOVID09PVxuICBcbiAgLyoqXG4gICAqIOWBpeW6t+ajgOafpVxuICAgKi9cbiAgYXN5bmMgaGVhbHRoQ2hlY2soKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5odHRwQ2xpZW50LmdldCgnL2FwaS92MS93ZWNoYXQvaGVhbHRoJyk7XG4gICAgICByZXR1cm4gcmVzcG9uc2Uuc3VjY2VzcztcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvLyBDbGF1ZGUgQ29kZSBBREQ6IOaWsOWinui0puaIt+euoeeQhuaWueazlVxuXG4gIC8qKlxuICAgKiDpqozor4FBdXRoS2V55piv5ZCm5pyJ5pWIXG4gICAqL1xuICBhc3luYyB2ZXJpZnlBdXRoS2V5KGF1dGhLZXk6IHN0cmluZyk6IFByb21pc2U8VmVyaWZ5QXV0aEtleVJlc3BvbnNlPiB7XG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+UkSDpqozor4FBdXRoS2V5Li4uJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHBDbGllbnQucG9zdDxWZXJpZnlBdXRoS2V5UmVzcG9uc2U+KCcvYXBpL3YxL3dlY2hhdC92ZXJpZnktYXV0aC1rZXknLCB7XG4gICAgICBhdXRoX2tleTogYXV0aEtleVxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzIHx8ICFyZXNwb25zZS5kYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOmqjOivgUF1dGhLZXnlpLHotKU6ICR7cmVzcG9uc2UuZXJyb3IgfHwgJ+acquefpemUmeivryd9YCk7XG4gICAgfVxuXG4gICAgaWYgKEJBQ0tFTkRfQ09ORklHLkRFQlVHKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pyFIEF1dGhLZXnpqozor4HlrozmiJA6JywgcmVzcG9uc2UuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIOazqOWGjOaIluabtOaWsOWFrOS8l+WPt+i0puaIt1xuICAgKi9cbiAgYXN5bmMgcmVnaXN0ZXJBY2NvdW50KHJlcXVlc3Q6IFJlZ2lzdGVyQWNjb3VudFJlcXVlc3QpOiBQcm9taXNlPEFwaVJlc3BvbnNlPGFueT4+IHtcbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5OdIOazqOWGjOWFrOS8l+WPt+i0puaItzonLCByZXF1ZXN0LmFwcF9pZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHBDbGllbnQucG9zdCgnL2FwaS92MS93ZWNoYXQvcmVnaXN0ZXItYWNjb3VudCcsIHtcbiAgICAgIGFwcF9pZDogcmVxdWVzdC5hcHBfaWQsXG4gICAgICBhcHBfc2VjcmV0OiByZXF1ZXN0LmFwcF9zZWNyZXQsXG4gICAgICBuYW1lOiByZXF1ZXN0Lm5hbWUsXG4gICAgICBhdXRoX2tleTogcmVxdWVzdC5hdXRoX2tleVxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOazqOWGjOWFrOS8l+WPt+Wksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5YWs5LyX5Y+36LSm5oi35rOo5YaM5oiQ5YqfJyk7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiDmo4Dmn6XlhazkvJflj7fmnYPpmZBcbiAgICovXG4gIGFzeW5jIGNoZWNrUGVybWlzc2lvbihhcHBJZDogc3RyaW5nKTogUHJvbWlzZTxQZXJtaXNzaW9uSW5mbz4ge1xuICAgIGlmIChCQUNLRU5EX0NPTkZJRy5ERUJVRykge1xuICAgICAgY29uc29sZS5sb2coJ/CflI0g5qOA5p+l5YWs5LyX5Y+35p2D6ZmQOicsIGFwcElkKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuaHR0cENsaWVudC5nZXQ8UGVybWlzc2lvbkluZm8+KCcvYXBpL3YxL3dlY2hhdC9jaGVjay1wZXJtaXNzaW9uJywge1xuICAgICAgYXBwX2lkOiBhcHBJZFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXNwb25zZS5zdWNjZXNzIHx8ICFyZXNwb25zZS5kYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYOajgOafpeadg+mZkOWksei0pTogJHtyZXNwb25zZS5lcnJvcn1gKTtcbiAgICB9XG5cbiAgICBpZiAoQkFDS0VORF9DT05GSUcuREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUg5p2D6ZmQ5qOA5p+l5a6M5oiQOicsIHJlc3BvbnNlLmRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgfVxufVxuXG4vLyA9PT0g5YW85a655oCn5Ye95pWw77yI5ZCR5ZCO5YW85a6577yJID09PVxuXG4vKipcbiAqIOiOt+WPluW+ruS/oVRva2Vu77yI5YW85a655oCn5Ye95pWw77yJXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3eEdldFRva2VuKGFwcGlkOiBzdHJpbmcsIHNlY3JldDogc3RyaW5nKTogUHJvbWlzZTxXZWNoYXRUb2tlblJlc3BvbnNlPiB7XG4gIC8vIOi/meS4quWHveaVsOmcgOimgeWFqOWxgOeahOW+ruS/oeWuouaIt+err+WunuS+i++8jOWwhuWcqGluZGV4LnRz5Lit5a6e546wXG4gIHRocm93IG5ldyBFcnJvcign6K+35L2/55SoIGdldFdlY2hhdENsaWVudCgpLmF1dGhlbnRpY2F0ZSgpIOabv+S7oycpO1xufVxuXG4vKipcbiAqIOS4iuS8oOWbvueJh+WIsOW+ruS/oe+8iOWFvOWuueaAp+WHveaVsO+8iVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3hVcGxvYWRJbWFnZShcbiAgZGF0YTogQmxvYiwgXG4gIGZpbGVuYW1lOiBzdHJpbmcsIFxuICB0b2tlbjogc3RyaW5nLCBcbiAgdHlwZT86IHN0cmluZ1xuKTogUHJvbWlzZTxNZWRpYVJlc3VsdD4ge1xuICAvLyDov5nkuKrlh73mlbDpnIDopoHlhajlsYDnmoTlvq7kv6HlrqLmiLfnq6/lrp7kvovvvIzlsIblnKhpbmRleC50c+S4reWunueOsFxuICB0aHJvdyBuZXcgRXJyb3IoJ+ivt+S9v+eUqCBnZXRXZWNoYXRDbGllbnQoKS51cGxvYWRNZWRpYSgpIOabv+S7oycpO1xufVxuXG4vKipcbiAqIOa3u+WKoOiNieeov++8iOWFvOWuueaAp+WHveaVsO+8iVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3hBZGREcmFmdChhcnRpY2xlczogRHJhZnRBcnRpY2xlW10sIHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPERyYWZ0UmVzdWx0PiB7XG4gIC8vIOi/meS4quWHveaVsOmcgOimgeWFqOWxgOeahOW+ruS/oeWuouaIt+err+WunuS+i++8jOWwhuWcqGluZGV4LnRz5Lit5a6e546wXG4gIHRocm93IG5ldyBFcnJvcign6K+35L2/55SoIGdldFdlY2hhdENsaWVudCgpLmNyZWF0ZURyYWZ0KCkg5pu/5LujJyk7XG59XG4iXX0=