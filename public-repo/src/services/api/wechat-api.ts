/**
 * 微信API客户端模块
 * 提供微信公众号相关的所有API功能
 */

import { HttpClient, ApiResponse } from './http-client';

// === 微信相关类型定义 ===
export interface WechatAuth {
  appId: string;
  appSecret: string;
}

export interface WechatTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface MediaUpload {
  mediaData: string; // base64编码的媒体数据
  filename: string;
  accessToken: string;
  mediaType?: 'image' | 'video' | 'audio'; // 媒体类型
  storageType?: 'temporary' | 'permanent'; // 存储类型
}

export interface MediaResult {
  errcode: number;
  errmsg?: string;
  media_id?: string;
  url?: string;
}

export interface DraftArticle {
  title: string;
  content: string;
  author?: string;
  digest?: string;
  content_source_url?: string;
  thumb_media_id?: string;
  show_cover_pic?: boolean;
  need_open_comment?: boolean;
  only_fans_can_comment?: boolean;
}

export interface DraftResult {
  errcode: number;
  errmsg?: string;
  media_id?: string;
}

export interface PublishResult {
  errcode: number;
  errmsg?: string;
  publish_id?: string;
  msg_id?: string;
}

export interface MediaListParams {
  type: string;
  offset: number;
  count: number;
  accessToken: string;
}

export interface MediaListResult {
  errcode: number;
  errmsg?: string;
  total_count?: number;
  item_count?: number;
  item?: Array<{
    media_id: string;
    name?: string;
    update_time?: number;
    url?: string;
  }>;
}

export interface DraftListResult {
  errcode: number;
  errmsg?: string;
  total_count?: number;
  item_count?: number;
  item?: Array<{
    media_id: string;
    content?: {
      news_item: Array<{
        title: string;
        author: string;
        digest: string;
        content: string;
        content_source_url: string;
        thumb_media_id: string;
        show_cover_pic: number;
        need_open_comment: number;
        only_fans_can_comment: number;
      }>;
    };
    update_time?: number;
  }>;
}

export interface PublishStatusResult {
  errcode: number;
  errmsg?: string;
  publish_status?: number; // 0:成功, 1:发布中, 2:原创失败, 3:常规失败, 4:平台审核不通过, 5:成功后用户删除所有文章
  article_id?: string;
  article_url?: string;
  fail_idx?: number[];
}

/**
 * 微信客户端类
 * 封装所有微信公众号API操作
 */
export class WechatClient {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;

  }

  // === 认证相关方法 ===
  
  /**
   * 获取访问令牌
   */
  async authenticate(auth: WechatAuth): Promise<WechatTokenResponse> {

    console.log('📋 API请求参数:', {
      app_id: auth.appId,
      app_secret: `${auth.appSecret.substring(0, 8)}...${auth.appSecret.substring(auth.appSecret.length - 4)}`,
      app_secret_length: auth.appSecret.length
    });
    
    const response = await this.httpClient.post<WechatTokenResponse>('/api/v1/wechat/access-token', {
      app_id: auth.appId,
      app_secret: auth.appSecret
    });

    if (!response.success) {
      throw new Error(`获取访问令牌失败: ${response.error}`);
    }

    return response.data!;
  }

  // === 媒体管理方法 ===
  
  /**
   * 上传媒体文件
   */
  async uploadMedia(upload: MediaUpload): Promise<MediaResult> {

    const requestData = {
      image_data: upload.mediaData,
      filename: upload.filename,
      access_token: upload.accessToken,
      type: upload.storageType === 'permanent' ? 'image' : undefined
    };

    const response = await this.httpClient.post<MediaResult>('/api/v1/wechat/upload-image', requestData);

    if (!response.success) {

      throw new Error(`媒体上传失败: ${response.error}`);
    }

    const result = response.data!;
    
    if (result.errcode !== 0) {

      throw new Error(`微信API错误: ${result.errmsg}`);
    }

    return result;
  }

  /**
   * 获取媒体列表
   */
  async getMediaList(params: MediaListParams): Promise<MediaListResult> {

    const response = await this.httpClient.post<MediaListResult>('/api/v1/wechat/batch-get-material', {
      type: params.type,
      offset: params.offset,
      count: params.count,
      access_token: params.accessToken
    });

    if (!response.success) {
      throw new Error(`获取媒体列表失败: ${response.error}`);
    }

    const result = response.data!;

    if (result.errcode !== undefined && result.errcode !== 0) {
      throw new Error(`微信API错误: ${result.errmsg || '未知错误'}`);
    }

    if (result.total_count === undefined) {
      throw new Error('微信API响应格式异常：缺少total_count字段');
    }

    return result;
  }

  // === 草稿管理方法 ===
  
  /**
   * 创建草稿
   */
  async createDraft(draft: DraftArticle[], accessToken: string): Promise<DraftResult> {

    const response = await this.httpClient.post<DraftResult>('/api/v1/wechat/create-draft', {
      articles: draft,
      access_token: accessToken
    });

    if (!response.success) {

      throw new Error(`草稿创建失败: ${response.error}`);
    }

    const result = response.data!;
    
    if (result.errcode !== 0) {

      throw new Error(`微信API错误: ${result.errmsg}`);
    }

    return result;
  }

  /**
   * 更新草稿
   */
  async updateDraft(
    draftId: string, 
    index: number, 
    article: DraftArticle, 
    accessToken: string
  ): Promise<DraftResult> {

    const response = await this.httpClient.put<DraftResult>('/api/v1/wechat/update-draft', {
      media_id: draftId,
      index,
      article,
      access_token: accessToken
    });

    if (!response.success) {
      throw new Error(`草稿更新失败: ${response.error}`);
    }

    const result = response.data!;
    
    if (result.errcode !== 0) {
      throw new Error(`微信API错误: ${result.errmsg}`);
    }

    return result;
  }

  /**
   * 删除草稿
   */
  async deleteDraft(draftId: string, index: number, accessToken: string): Promise<ApiResponse> {

    const response = await this.httpClient.delete('/api/v1/wechat/delete-draft', {
      media_id: draftId,
      index,
      access_token: accessToken
    });

    if (!response.success) {
      throw new Error(`草稿删除失败: ${response.error}`);
    }

    return response;
  }

  /**
   * 获取草稿列表
   */
  async getDraftList(accessToken: string, offset = 0, count = 20): Promise<DraftListResult> {

    const response = await this.httpClient.get<DraftListResult>('/api/v1/wechat/drafts', {
      access_token: accessToken,
      offset,
      count
    });

    if (!response.success) {
      throw new Error(`获取草稿列表失败: ${response.error}`);
    }

    const result = response.data!;

    if (result.errcode !== undefined && result.errcode !== 0) {
      throw new Error(`微信API错误: ${result.errmsg || '未知错误'}`);
    }

    if (result.total_count === undefined) {
      throw new Error('微信API响应格式异常：缺少total_count字段');
    }

    return result;
  }

  // === 发布管理方法 ===
  
  /**
   * 发布内容
   */
  async publishContent(draftId: string, accessToken: string): Promise<PublishResult> {

    const response = await this.httpClient.post<PublishResult>('/api/v1/wechat/publish-draft', {
      media_id: draftId,
      access_token: accessToken
    });

    if (!response.success) {

      throw new Error(`内容发布失败: ${response.error}`);
    }

    const result = response.data!;
    
    if (result.errcode !== 0) {

      throw new Error(`微信API错误: ${result.errmsg}`);
    }

    return result;
  }

  /**
   * 获取发布状态
   */
  async getPublishStatus(publishId: string, accessToken: string): Promise<PublishStatusResult> {

    const response = await this.httpClient.post<PublishStatusResult>('/api/v1/wechat/publish-status', {
      publish_id: publishId,
      access_token: accessToken
    });

    if (!response.success) {
      throw new Error(`获取发布状态失败: ${response.error}`);
    }

    const result = response.data!;
    
    if (result.errcode !== 0) {
      throw new Error(`微信API错误: ${result.errmsg}`);
    }

    return result;
  }

  // === 辅助方法 ===
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/api/v1/wechat/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// === 兼容性函数（向后兼容） ===

/**
 * 获取微信Token（兼容性函数）
 */
export async function wxGetToken(appid: string, secret: string): Promise<WechatTokenResponse> {

  throw new Error('请使用 getWechatClient().authenticate() 替代');
}

/**
 * 上传图片到微信（兼容性函数）
 */
export async function wxUploadImage(
  data: Blob, 
  filename: string, 
  token: string, 
  type?: string
): Promise<MediaResult> {

  throw new Error('请使用 getWechatClient().uploadMedia() 替代');
}

/**
 * 添加草稿（兼容性函数）
 */
export async function wxAddDraft(articles: DraftArticle[], token: string): Promise<DraftResult> {

  throw new Error('请使用 getWechatClient().createDraft() 替代');
}