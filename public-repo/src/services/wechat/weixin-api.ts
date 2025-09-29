import { requestUrl, RequestUrlParam, getBlobArrayBuffer } from "obsidian";

import { NMPSettings } from '../../core/settings';

const LocalBackendHost = 'http://127.0.0.1:8000';

function getAuthHeaders(): { [key: string]: string } {
    return {
        'X-API-Key': 'wdwxedit-api-key-2024', // 使用后端.env中配置的API Key
        'Content-Type': 'application/json',
    };
}

export async function wxGetToken(authkey:string, appid:string, secret:string) {
    const url = `${LocalBackendHost}/api/v1/wechat/access-token`;
    
    try {
        const requestBody = {
            app_id: appid,
            app_secret: secret
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            const data = resData.data;
            return {
                json: {
                    token: data.access_token || '',
                    expires_in: data.expires_in || 7200
                },
                status: 200
            };
        } else {

            const errorMsg = resData.error || '获取Token失败';
            let code = 0;
            let message = errorMsg;
            
            if (errorMsg.includes('40125') || errorMsg.includes('AppSecret')) {
                code = 40125;
                message = 'AppSecret错误';
            } else if (errorMsg.includes('40164') || errorMsg.includes('IP')) {
                code = 40164;
                message = 'IP地址不在白名单中';
            } else if (errorMsg.includes('50002')) {
                code = 50002;
                message = '用户受限';
            }
            
            return {
                json: {
                    code,
                    message,
                    token: ''
                },
                status: 400
            };
        }
    } catch (error) {

        return {
            json: {
                code: 1,
                message: `获取Token失败: ${error}`,
                token: ''
            },
            status: 500
        };
    }
}

export async function wxEncrypt(authkey:string, wechat:any[]) {
    const url = `${LocalBackendHost}/api/v1/wechat/save-accounts`;
    
    try {
        const requestBody = {
            authkey,
            wechat
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            return {
                json: resData.data,
                status: 200
            };
        } else {
            return {
                json: {
                    message: resData.error || '保存失败'
                },
                status: 400
            };
        }
    } catch (error) {

        return {
            json: {
                message: `保存失败: ${error}`
            },
            status: 500
        };
    }
}

export async function wxKeyInfo(authkey:string) {
    const url = `${LocalBackendHost}/api/v1/premium/key-info`;
    
    try {
        const res = await requestUrl({
            url,
            method: 'GET',
            throw: false,
            headers: {
                ...getAuthHeaders(),
                'X-Auth-Key': authkey
            }
        });
        
        const resData = res.json;
        if (resData.success) {
            return {
                json: {
                    vip: resData.data?.vip || false,
                    expireat: resData.data?.expireat || new Date()
                },
                status: 200
            };
        } else {
            return {
                json: {
                    vip: false,
                    expireat: new Date()
                },
                status: 400
            };
        }
    } catch (error) {

        return {
            json: {
                vip: false,
                expireat: new Date()
            },
            status: 500
        };
    }
}

export async function wxUploadImage(data: Blob, filename: string, token: string, type?: string) {
    const url = `${LocalBackendHost}/api/v1/wechat/upload-image`;
    
    try {

        const arrayBuffer = await getBlobArrayBuffer(data);
        const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const requestBody = {
            image_data: base64String,
            filename: filename,
            access_token: token,
            type: type || null
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            const data = resData.data;
            return {
                url: data.url || '',
                media_id: data.media_id || '',
                errcode: data.errcode || 0,
                errmsg: data.errmsg || '',
            };
        } else {
            return {
                url: '',
                media_id: '',
                errcode: 1,
                errmsg: resData.error || '上传失败',
            };
        }
    } catch (error) {

        return {
            url: '',
            media_id: '',
            errcode: 1,
            errmsg: `上传失败: ${error}`,
        };
    }
}

export interface DraftArticle {
    title: string;
    author?: string;
    digest?: string;
    cover?: string;
    content: string;
    content_source_url?: string;
    thumb_media_id: string;
    need_open_comment?: number;
    only_fans_can_comment?: number;
    pic_crop_235_1?: string;
    pic_crop_1_1?: string;
    appid?: string;
    theme?: string;
    highlight?: string;
}

export async function wxAddDraft(token: string, data: DraftArticle) {
    const url = `${LocalBackendHost}/api/v1/wechat/create-draft`;
    
    try {
        const articleData = {
            title: data.title,
            content: data.content,
            digest: data.digest || (data.title ? data.title.substring(0, 100) : ''),
            thumb_media_id: data.thumb_media_id || '',
            show_cover_pic: 1,
            author: data.author || '',
            content_source_url: data.content_source_url || '',
            need_open_comment: data.need_open_comment,
            only_fans_can_comment: data.only_fans_can_comment,
            pic_crop_235_1: data.pic_crop_235_1 || '',
            pic_crop_1_1: data.pic_crop_1_1 || ''
        };
        
        const requestBody = {
            articles: [articleData],
            access_token: token
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            return {
                json: resData.data,
                status: 200
            };
        } else {
            return {
                json: {
                    errcode: 1,
                    errmsg: resData.error || '创建草稿失败'
                },
                status: 400
            };
        }
    } catch (error) {

        return {
            json: {
                errcode: 1,
                errmsg: `创建草稿失败: ${error}`
            },
            status: 500
        };
    }
}

export interface DraftImageMediaId {
    image_media_id: string;
}

export interface DraftImageInfo {
    image_list: DraftImageMediaId[];
}

export interface DraftImages {
    article_type: string;
    title: string;
    content: string;
    need_open_commnet: number;
    only_fans_can_comment: number;
    image_info: DraftImageInfo;
}

export async function wxAddDraftImages(token: string, data: DraftImages) {
    const url = `${LocalBackendHost}/api/v1/wechat/create-draft`;
    
    try {
        const articleData = {
            title: data.title,
            content: data.content,
            digest: data.title.substring(0, 100),
            article_type: data.article_type,
            thumb_media_id: '',
            show_cover_pic: 0,
            author: '',
            content_source_url: '',
            need_open_comment: data.need_open_commnet,
            only_fans_can_comment: data.only_fans_can_comment,
            image_info: data.image_info
        };
        
        const requestBody = {
            articles: [articleData],
            access_token: token
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            return {
                json: resData.data,
                status: 200
            };
        } else {
            return {
                json: {
                    errcode: 1,
                    errmsg: resData.error || '创建图文草稿失败'
                },
                status: 400
            };
        }
    } catch (error) {

        return {
            json: {
                errcode: 1,
                errmsg: `创建图文草稿失败: ${error}`
            },
            status: 500
        };
    }
}

export async function wxBatchGetMaterial(token: string, type: string, offset: number = 0, count: number = 10) {
    const url = `${LocalBackendHost}/api/v1/wechat/batch-get-material`;
    
    try {
        const requestBody = {
            type,
            offset,
            count,
            access_token: token
        };
        
        const res = await requestUrl({
            url,
            method: 'POST',
            throw: false,
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        const resData = res.json;
        if (resData.success) {
            return resData.data;
        } else {
            return {
                errcode: 1,
                errmsg: resData.error || '获取素材列表失败',
                item: [],
                total_count: 0,
                item_count: 0
            };
        }
    } catch (error) {

        return {
            errcode: 1,
            errmsg: `获取素材列表失败: ${error}`,
            item: [],
            total_count: 0,
            item_count: 0
        };
    }
}