import { getBlobArrayBuffer } from "obsidian";

import { wxUploadImage } from "../api";
import { WxSettings } from "../../core/settings";
import { IsWasmReady, LoadWasm } from "../../shared/wasm/wasm";
import  AssetsManager from "../../core/assets";

declare function GoWebpToJPG(data: Uint8Array): Uint8Array;
declare function GoWebpToPNG(data: Uint8Array): Uint8Array;
declare function GoAddWatermark(img: Uint8Array, watermark: Uint8Array): Uint8Array;

export function IsImageLibReady() {
  return IsWasmReady();
}

export async function PrepareImageLib() {
  await LoadWasm();
}

export function WebpToJPG(data: ArrayBuffer): ArrayBuffer {
  return GoWebpToJPG(new Uint8Array(data));
}

export function WebpToPNG(data: ArrayBuffer): ArrayBuffer {
  return GoWebpToPNG(new Uint8Array(data));
}

export function AddWatermark(img: ArrayBuffer, watermark: ArrayBuffer): ArrayBuffer {
  return GoAddWatermark(new Uint8Array(img), new Uint8Array(watermark));
}

export async function UploadImageToWx(data: Blob, filename: string, token: string, type?: string) {
  if (!IsImageLibReady()) {
    await PrepareImageLib(); 
  }
  
  const watermark = WxSettings.getInstance().watermark;
  if (watermark != null && watermark != '') {
    const watermarkData = await AssetsManager.getInstance().readFileBinary(watermark);
    if (watermarkData == null) {
      throw new Error('水印图片不存在: ' + watermark);
    }
    const watermarkImg = AddWatermark(await data.arrayBuffer(), watermarkData);
    data = new Blob([watermarkImg], { type: data.type });
  }

  console.log('🔍 开始上传图片:', {
    filename,
    fileSize: data.size,
    fileType: data.type,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
    type
  });
  
  const result = await wxUploadImage(data, filename, token, type);

  return result;
}