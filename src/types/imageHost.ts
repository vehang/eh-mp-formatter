/**
 * 图床类型定义
 * 支持主流 OSS 平台和传统图床
 */

// ═══════════════════════════════════════════════════════════════
// 图床类型定义
// ═══════════════════════════════════════════════════════════════

// 传统图床
type TraditionalHostType = 'dk' | 'bolt'

// OSS 云存储平台
type OSSHostType = 'aliyun' | 'tencent' | 'qiniu' | 'aws' | 'upyun' | 'huawei' | 'netease' | 'jd'

// 所有支持的图床类型
export type ImageHostType = TraditionalHostType | OSSHostType

// ═══════════════════════════════════════════════════════════════
// 各平台配置类型
// ═══════════════════════════════════════════════════════════════

// 阿里云 OSS 配置
export interface AliyunOSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string // 例如: oss-cn-hangzhou
  endpoint?: string // 自定义 endpoint
  customDomain?: string // 自定义域名
  pathPrefix?: string // 存储路径前缀
}

// 腾讯云 COS 配置
export interface TencentCOSConfig {
  secretId: string
  secretKey: string
  bucket: string
  region: string // 例如: ap-guangzhou
  customDomain?: string
  pathPrefix?: string
}

// 七牛云配置
export interface QiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  domain: string // 必须提供域名
  pathPrefix?: string
}

// AWS S3 配置
export interface AWSS3Config {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region: string
  customDomain?: string
  pathPrefix?: string
}

// 又拍云配置
export interface UpyunConfig {
  operator: string
  password: string
  bucket: string
  domain: string
  pathPrefix?: string
}

// 华为云 OBS 配置
export interface HuaweiOBSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  customDomain?: string
  pathPrefix?: string
}

// 网易云 NOS 配置
export interface NeteaseNOSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  customDomain?: string
  pathPrefix?: string
}

// 京东云 OSS 配置
export interface JDOSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  customDomain?: string
  pathPrefix?: string
}

// 传统图床配置
export interface TraditionalHostConfig {
  token?: string
}

// OSS 配置联合类型
export type AnyOSSConfig =
  | Partial<AliyunOSSConfig>
  | Partial<TencentCOSConfig>
  | Partial<QiniuConfig>
  | Partial<AWSS3Config>
  | Partial<UpyunConfig>
  | Partial<HuaweiOBSConfig>
  | Partial<NeteaseNOSConfig>
  | Partial<JDOSSConfig>

// 图床配置值（用于组件状态）
export type HostConfigValue = string | undefined | Record<string, string | undefined>

// 单个图床配置（联合类型）
export type ImageHostConfig =
  | { type: TraditionalHostType; token?: string }
  | { type: 'aliyun'; config: AliyunOSSConfig }
  | { type: 'tencent'; config: TencentCOSConfig }
  | { type: 'qiniu'; config: QiniuConfig }
  | { type: 'aws'; config: AWSS3Config }
  | { type: 'upyun'; config: UpyunConfig }
  | { type: 'huawei'; config: HuaweiOBSConfig }
  | { type: 'netease'; config: NeteaseNOSConfig }
  | { type: 'jd'; config: JDOSSConfig }

// ═══════════════════════════════════════════════════════════════
// 存储结构
// ═══════════════════════════════════════════════════════════════

// 图床设置（存储结构）
export interface ImageHostSettings {
  // 传统图床
  dk: { token: string; isConfigured: boolean }
  bolt: { token?: string; isConfigured: boolean }

  // OSS 云存储
  aliyun: { config: Partial<AliyunOSSConfig>; isConfigured: boolean }
  tencent: { config: Partial<TencentCOSConfig>; isConfigured: boolean }
  qiniu: { config: Partial<QiniuConfig>; isConfigured: boolean }
  aws: { config: Partial<AWSS3Config>; isConfigured: boolean }
  upyun: { config: Partial<UpyunConfig>; isConfigured: boolean }
  huawei: { config: Partial<HuaweiOBSConfig>; isConfigured: boolean }
  netease: { config: Partial<NeteaseNOSConfig>; isConfigured: boolean }
  jd: { config: Partial<JDOSSConfig>; isConfigured: boolean }

  defaultHost: ImageHostType | null
}

// 传统图床设置类型
export type TraditionalHostSettings = { token?: string; isConfigured: boolean }

// OSS 图床设置类型
export type OSSHostSettings = { config: Record<string, string | undefined>; isConfigured: boolean }

// ═══════════════════════════════════════════════════════════════
// 图床元信息
// ═══════════════════════════════════════════════════════════════

export interface ImageHostInfo {
  name: string
  description: string
  icon: string
  category: 'traditional' | 'oss-domestic' | 'oss-international'
  links: {
    official: string
    console?: string
    docs: string
  }
  requiresToken: boolean
  requiredFields: string[]
}

// 图床元信息
export const IMAGE_HOSTS: Record<ImageHostType, ImageHostInfo> = {
  // 传统图床
  dk: {
    name: 'DK图床',
    description: '免费图片托管服务',
    icon: 'lucide:hard-drive',
    category: 'traditional',
    links: {
      official: 'https://img.dkdun.cn',
      docs: 'https://img.dkdun.cn/page/api-docs.html',
    },
    requiresToken: true,
    requiredFields: ['token'],
  },
  bolt: {
    name: '闪电图床',
    description: '无需配置，即用即传',
    icon: 'lucide:zap',
    category: 'traditional',
    links: {
      official: 'https://www.boltp.com',
      docs: 'https://www.boltp.com/pages/api-docs',
    },
    requiresToken: false,
    requiredFields: [],
  },

  // 国内 OSS
  aliyun: {
    name: '阿里云 OSS',
    description: '阿里云对象存储服务',
    icon: 'brand:aliyun',
    category: 'oss-domestic',
    links: {
      official: 'https://www.aliyun.com/product/oss',
      console: 'https://oss.console.aliyun.com',
      docs: 'https://help.aliyun.com/document_detail/31827.html',
    },
    requiresToken: true,
    requiredFields: ['accessKeyId', 'accessKeySecret', 'bucket', 'region'],
  },
  tencent: {
    name: '腾讯云 COS',
    description: '腾讯云对象存储服务',
    icon: 'brand:tencent',
    category: 'oss-domestic',
    links: {
      official: 'https://cloud.tencent.com/product/cos',
      console: 'https://console.cloud.tencent.com/cos',
      docs: 'https://cloud.tencent.com/document/product/436',
    },
    requiresToken: true,
    requiredFields: ['secretId', 'secretKey', 'bucket', 'region'],
  },
  qiniu: {
    name: '七牛云',
    description: '七牛云存储服务',
    icon: 'lucide:hard-drive',
    category: 'oss-domestic',
    links: {
      official: 'https://www.qiniu.com',
      console: 'https://portal.qiniu.com',
      docs: 'https://developer.qiniu.com/kodo',
    },
    requiresToken: true,
    requiredFields: ['accessKey', 'secretKey', 'bucket', 'domain'],
  },
  upyun: {
    name: '又拍云',
    description: '又拍云存储服务',
    icon: 'lucide:upload-cloud',
    category: 'oss-domestic',
    links: {
      official: 'https://www.upyun.com',
      console: 'https://console.upyun.com',
      docs: 'https://help.upyun.com/knowledge-base/',
    },
    requiresToken: true,
    requiredFields: ['operator', 'password', 'bucket', 'domain'],
  },
  huawei: {
    name: '华为云 OBS',
    description: '华为云对象存储服务',
    icon: 'brand:huawei',
    category: 'oss-domestic',
    links: {
      official: 'https://www.huaweicloud.com/product/obs.html',
      console: 'https://console.huaweicloud.com/console/#/obs',
      docs: 'https://support.huaweicloud.com/obs/index.html',
    },
    requiresToken: true,
    requiredFields: ['accessKeyId', 'accessKeySecret', 'bucket', 'region'],
  },
  netease: {
    name: '网易云 NOS',
    description: '网易云对象存储服务',
    icon: 'brand:netease',
    category: 'oss-domestic',
    links: {
      official: 'https://www.163yun.com/product/nos',
      console: 'https://c.163.com/dashboard',
      docs: 'https://www.163yun.com/help/document',
    },
    requiresToken: true,
    requiredFields: ['accessKeyId', 'accessKeySecret', 'bucket', 'region'],
  },
  jd: {
    name: '京东云 OSS',
    description: '京东云对象存储服务',
    icon: 'lucide:shopping-bag',
    category: 'oss-domestic',
    links: {
      official: 'https://www.jdcloud.com/cn/products/object-storage-service',
      console: 'https://oss-console.jdcloud.com',
      docs: 'https://docs.jdcloud.com/cn/object-storage-service',
    },
    requiresToken: true,
    requiredFields: ['accessKeyId', 'accessKeySecret', 'bucket', 'region'],
  },

  // 国际 OSS
  aws: {
    name: 'AWS S3',
    description: 'Amazon S3 对象存储服务',
    icon: 'brand:aws',
    category: 'oss-international',
    links: {
      official: 'https://aws.amazon.com/s3',
      console: 'https://console.aws.amazon.com/s3',
      docs: 'https://docs.aws.amazon.com/s3',
    },
    requiresToken: true,
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'region'],
  },
}

// 图床是否需要 token
export const HOST_REQUIRES_TOKEN: Record<ImageHostType, boolean> = {
  dk: true,
  bolt: false,
  aliyun: true,
  tencent: true,
  qiniu: true,
  aws: true,
  upyun: true,
  huawei: true,
  netease: true,
  jd: true,
}

// ═══════════════════════════════════════════════════════════════
// 上传相关类型
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// 地域节点配置
// ═══════════════════════════════════════════════════════════════

// 阿里云 OSS 地域
export const ALIYUN_REGIONS = [
  { value: 'oss-cn-hangzhou', label: '华东1（杭州）' },
  { value: 'oss-cn-shanghai', label: '华东2（上海）' },
  { value: 'oss-cn-qingdao', label: '华北1（青岛）' },
  { value: 'oss-cn-beijing', label: '华北2（北京）' },
  { value: 'oss-cn-zhangjiakou', label: '华北3（张家口）' },
  { value: 'oss-cn-huhehaote', label: '华北5（呼和浩特）' },
  { value: 'oss-cn-wulanchabu', label: '华北6（乌兰察布）' },
  { value: 'oss-cn-shenzhen', label: '华南1（深圳）' },
  { value: 'oss-cn-heyuan', label: '华南2（河源）' },
  { value: 'oss-cn-guangzhou', label: '华南3（广州）' },
  { value: 'oss-cn-chengdu', label: '西南1（成都）' },
  { value: 'oss-cn-hongkong', label: '中国香港' },
]

// 腾讯云 COS 地域
export const TENCENT_REGIONS = [
  { value: 'ap-beijing', label: '北京' },
  { value: 'ap-nanjing', label: '南京' },
  { value: 'ap-shanghai', label: '上海' },
  { value: 'ap-guangzhou', label: '广州' },
  { value: 'ap-chengdu', label: '成都' },
  { value: 'ap-chongqing', label: '重庆' },
  { value: 'ap-shenzhen-fsi', label: '深圳金融' },
  { value: 'ap-shanghai-fsi', label: '上海金融' },
  { value: 'ap-beijing-fsi', label: '北京金融' },
  { value: 'ap-hongkong', label: '香港' },
  { value: 'ap-singapore', label: '新加坡' },
]

// AWS S3 地域
export const AWS_REGIONS = [
  { value: 'us-east-1', label: '美国东部 (弗吉尼亚北部)' },
  { value: 'us-west-2', label: '美国西部 (俄勒冈)' },
  { value: 'eu-west-1', label: '欧洲 (爱尔兰)' },
  { value: 'eu-central-1', label: '欧洲 (法兰克福)' },
  { value: 'ap-northeast-1', label: '亚太地区 (东京)' },
  { value: 'ap-northeast-2', label: '亚太地区 (首尔)' },
  { value: 'ap-southeast-1', label: '亚太地区 (新加坡)' },
  { value: 'ap-southeast-2', label: '亚太地区 (悉尼)' },
  { value: 'ap-east-1', label: '亚太地区 (香港)' },
]

// 华为云 OBS 地域
export const HUAWEI_REGIONS = [
  { value: 'cn-north-1', label: '华北-北京一' },
  { value: 'cn-north-4', label: '华北-北京四' },
  { value: 'cn-east-3', label: '华东-上海一' },
  { value: 'cn-east-2', label: '华东-上海二' },
  { value: 'cn-south-1', label: '华南-广州' },
  { value: 'cn-south-2', label: '华南-深圳' },
  { value: 'ap-southeast-1', label: '中国-香港' },
]

// 京东云 OSS 地域
export const JD_REGIONS = [
  { value: 'cn-north-1', label: '华北-北京' },
  { value: 'cn-east-2', label: '华东-上海' },
  { value: 'cn-south-1', label: '华南-广州' },
]

// 网易云 NOS 地域
export const NETEASE_REGIONS = [
  { value: 'eastchina1', label: '华东' },
  { value: 'northchina1', label: '华北' },
  { value: 'southchina1', label: '华南' },
]
