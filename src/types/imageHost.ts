/**
 * 图床类型定义
 */

// 支持的图床服务
export type ImageHostType = 'hello' | 'dk' | 'bolt'

// 单个图床配置
export interface ImageHostConfig {
  type: ImageHostType
  name: string
  token: string
  isConfigured: boolean
}

// 图床设置（存储结构）
export interface ImageHostSettings {
  hello: {
    token: string
    isConfigured: boolean
  }
  dk: {
    token: string
    isConfigured: boolean
  }
  bolt: {
    token: string
    isConfigured: boolean
  }
  defaultHost: ImageHostType | null
}

// 上传进度
export interface UploadProgress {
  isUploading: boolean
  progress: number
  statusText: string
}

// 上传结果
export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// 图床信息
export const IMAGE_HOSTS: Record<ImageHostType, { name: string; apiUrl: string }> = {
  hello: {
    name: 'Hello图床',
    apiUrl: 'https://www.helloimg.com/api/v1/upload',
  },
  dk: {
    name: 'DK图床',
    apiUrl: 'https://www.helloimg.com/api/v1/upload',
  },
  bolt: {
    name: '闪电图床',
    apiUrl: 'https://www.boltp.com/api/v1/upload',
  },
}
