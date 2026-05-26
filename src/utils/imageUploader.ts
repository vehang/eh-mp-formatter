/**
 * 图片上传工具函数
 * 支持上传到多个图床服务和 OSS 平台
 */

import {
  IMAGE_HOSTS,
  HOST_REQUIRES_TOKEN,
  type ImageHostType,
  type UploadProgress,
  type UploadResult,
  type AliyunOSSConfig,
  type TencentCOSConfig,
  type QiniuConfig,
  type AWSS3Config,
  type UpyunConfig,
  type HuaweiOBSConfig,
  type NeteaseNOSConfig,
  type JDOSSConfig,
} from '../types/imageHost'

import CryptoJS from 'crypto-js'

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

/**
 * 生成唯一文件名
 */
function generateUniqueFilename(originalName: string, prefix?: string): string {
  const ext = originalName.split('.').pop() || 'png'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const filename = `${timestamp}_${random}.${ext}`
  return prefix ? `${prefix}/${filename}` : filename
}

/**
 * File 转 ArrayBuffer
 */
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 通用 XHR 上传
 * 消除各图床函数中 XHR + progress + 错误处理的重复代码
 */
function xhrUpload(options: {
  method: 'PUT' | 'POST'
  url: string
  headers?: Record<string, string>
  body?: ArrayBuffer
  formData?: FormData
  /** 从响应中提取图片 URL */
  extractUrl: (responseText: string, xhr: XMLHttpRequest) => string | undefined
  onProgress?: (progress: UploadProgress) => void
  timeout?: number
}): Promise<UploadResult> {
  const { method, url, headers, body, formData, extractUrl, onProgress, timeout = 120000 } = options

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress?.({ isUploading: true, progress, statusText: `上传中 ${progress}%` })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const imageUrl = extractUrl(xhr.responseText, xhr)
          if (imageUrl) {
            onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
            resolve({ success: true, url: imageUrl })
          } else {
            resolve({ success: false, error: '响应格式错误，未获取到图片链接' })
          }
        } catch {
          resolve({ success: false, error: '解析服务器响应失败' })
        }
      } else {
        resolve({ success: false, error: `上传失败 (${xhr.status})` })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({ success: false, error: '网络错误，请检查网络连接' })
    })

    xhr.timeout = timeout
    xhr.open(method, url)

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value)
      }
    }

    xhr.send(body || formData || null)
  })
}

// ═══════════════════════════════════════════════════════════════
// 传统图床上传 (DK/Bolt)
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到传统图床 (DK/Bolt)
 * 共用 /api/v1/upload 接口，FormData 提交
 */
async function uploadToTraditionalHost(
  file: File,
  hostType: 'dk' | 'bolt',
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const hostInfo = IMAGE_HOSTS[hostType]
  if (!hostInfo) return { success: false, error: '不支持的图床类型' }
  if (HOST_REQUIRES_TOKEN[hostType] && !token) return { success: false, error: '请先配置图床 Token' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传...' })

  const formData = new FormData()
  if (HOST_REQUIRES_TOKEN[hostType] && token) formData.append('token', token)
  formData.append('file', file)

  return xhrUpload({
    method: 'POST',
    url: hostInfo.links.official + '/api/v1/upload',
    formData,
    extractUrl: (text) => {
      const r = JSON.parse(text)
      return r.url || r.data?.url || r.links?.original
    },
    onProgress,
    timeout: 60000,
  })
}

// ═══════════════════════════════════════════════════════════════
// 闪电图床 v2 API 上传（需 Bearer Token + storage_id）
// ═══════════════════════════════════════════════════════════════
async function uploadToBolt(
  file: File,
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (!token) return { success: false, error: '请先配置闪电图床 API Token' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传...' })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('storage_id', '2') // 免费用户=2

  return xhrUpload({
    method: 'POST',
    url: 'https://www.boltp.com/api/v2/upload',
    formData,
    headers: { Authorization: `Bearer ${token}` },
    extractUrl: (text) => {
      const r = JSON.parse(text)
      return r.data?.public_url || r.data?.url || r.data?.pathname
    },
    onProgress,
    timeout: 60000,
  })
}

// ═══════════════════════════════════════════════════════════════
// ImgBB 免费图床上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到 ImgBB
 * 使用 imgbb.com/json 端点，无需 API Key
 */
async function uploadToImgBB(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 ImgBB...' })

  try {
    const formData = new FormData()
    formData.append('source', file)
    formData.append('action', 'upload')
    formData.append('type', 'file')

    const resp = await fetch('https://imgbb.com/json', { method: 'POST', body: formData })
    const data = await resp.json()

    if (data.status_code === 200 && data.image?.url) {
      onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
      return { success: true, url: data.image.url }
    }

    return { success: false, error: data.error?.message || '上传失败' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'ImgBB 上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// FreeImage.host 上传（Chevereto 系统，和 ImgBB API 格式一致）
// ═══════════════════════════════════════════════════════════════

async function uploadToFreeImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 FreeImage...' })

  try {
    const formData = new FormData()
    formData.append('source', file)
    formData.append('action', 'upload')
    formData.append('type', 'file')

    // 通过 nginx 反向代理绕过 CORS（FreeImage 不支持 CORS）
    const resp = await fetch('/api/freeimage/json', { method: 'POST', body: formData })
    const data = await resp.json()

    if (data.status_code === 200 && data.image?.url) {
      onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
      return { success: true, url: data.image.url }
    }

    return { success: false, error: data.error?.message || '上传失败' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'FreeImage 上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// Kappa.lol 轻量级图床上传
// ═══════════════════════════════════════════════════════════════

async function uploadToKappa(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 Kappa...' })

  try {
    const formData = new FormData()
    formData.append('file', file)

    const resp = await fetch('https://kappa.lol/api/upload', { method: 'POST', body: formData })
    const data = await resp.json()

    if (data.link) {
      onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
      return { success: true, url: data.link }
    }

    return { success: false, error: data.message || '上传失败' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Kappa 上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// Lewd.pics 轻量级图床上传（通过 nginx 代理绕过 CORS）
// ═══════════════════════════════════════════════════════════════

async function uploadToLewd(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 Lewd...' })

  try {
    const formData = new FormData()
    formData.append('fileToUpload', file)
    formData.append('curl2', '1')

    // 通过 nginx 反向代理绕过 CORS
    const resp = await fetch('/api/lewd/p/', { method: 'POST', body: formData })
    const text = await resp.text()

    // 返回格式: https://lewd.pics/p/?i=xxx.png
    if (text.startsWith('https://')) {
      // 转换为直接图片 URL: https://lewd.pics/p/xxx.png
      const match = text.match(/i=([^&\s]+)/)
      const directUrl = match ? `https://lewd.pics/p/${match[1]}` : text.trim()
      onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
      return { success: true, url: directUrl }
    }

    return { success: false, error: text || '上传失败' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Lewd 上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// S.EE（原 SM.MS）图床上传
// ═══════════════════════════════════════════════════════════════

async function uploadToSmms(
  file: File,
  token: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 S.EE...' })

  try {
    const formData = new FormData()
    formData.append('file', file)

    const resp = await fetch('https://s.ee/api/v1/file/upload', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData,
    })

    const data = await resp.json()

    if (data.code === 200 && data.data?.url) {
      onProgress?.({ isUploading: false, progress: 100, statusText: '上传成功' })
      return { success: true, url: data.data.url }
    }

    return { success: false, error: data.message || '上传失败' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'S.EE 上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// S3 兼容图床 — 签名工具函数
// ═══════════════════════════════════════════════════════════════

/**
 * 简单 PUT 签名（阿里云 OSS / 华为云 OBS / 网易云 NOS / 京东云 OSS 共用）
 * StringToSign = `PUT\n\n{contentType}\n{date}\n/{bucket}/{objectKey}`
 */
function signSimplePut(params: {
  bucket: string
  objectKey: string
  contentType: string
  date: string
  secretKey: string
  hmacMethod: 'sha1' | 'sha256'
  authPrefix: string
  accessKey: string
}): string {
  const { bucket, objectKey, contentType, date, secretKey, hmacMethod, authPrefix, accessKey } = params
  const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${objectKey}`
  const signature = hmacMethod === 'sha256'
    ? CryptoJS.HmacSHA256(stringToSign, secretKey).toString(CryptoJS.enc.Base64)
    : CryptoJS.HmacSHA1(stringToSign, secretKey).toString(CryptoJS.enc.Base64)
  return `${authPrefix} ${accessKey}:${signature}`
}

/**
 * 腾讯云 COS 签名（独特签名链）
 */
function signTencentCOS(params: {
  secretId: string
  secretKey: string
  host: string
  objectKey: string
}): string {
  const { secretId, secretKey, host, objectKey } = params
  const keyTime = `${Math.floor(Date.now() / 1000)};${Math.floor(Date.now() / 1000) + 3600}`
  const signKey = CryptoJS.HmacSHA1(keyTime, secretKey).toString()
  const httpString = `put\n/${objectKey}\n\nhost=${host}\n`
  const stringToSign = `sha1\n${keyTime}\n${CryptoJS.SHA1(httpString).toString()}\n`
  const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString()

  return [
    `q-sign-algorithm=sha1`,
    `q-ak=${secretId}`,
    `q-sign-time=${keyTime}`,
    `q-key-time=${keyTime}`,
    `q-header-list=host`,
    `q-url-param-list=`,
    `q-signature=${signature}`,
  ].join('&')
}

/**
 * AWS S3 Signature Version 4
 */
function signAWSS3(params: {
  accessKeyId: string
  secretAccessKey: string
  region: string
  host: string
  objectKey: string
}): { authorization: string; amzDate: string; extraHeaders: Record<string, string> } {
  const { accessKeyId, secretAccessKey, region, host, objectKey } = params
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substring(0, 8)

  const canonicalRequest = `PUT\n/${objectKey}\n\nhost:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n\nhost;x-amz-content-sha256;x-amz-date\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/s3/aws4_request\n${CryptoJS.SHA256(canonicalRequest).toString()}`

  const kDate = CryptoJS.HmacSHA256(dateStamp, `AWS4${secretAccessKey}`)
  const kRegion = CryptoJS.HmacSHA256(region, kDate)
  const kService = CryptoJS.HmacSHA256('s3', kRegion)
  const kSigning = CryptoJS.HmacSHA256('aws4_request', kService)
  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString()

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
    amzDate,
    extraHeaders: {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    },
  }
}

/**
 * 七牛云上传凭证
 */
function generateQiniuToken(params: {
  accessKey: string
  secretKey: string
  bucket: string
}): string {
  const { accessKey, secretKey, bucket } = params
  const deadline = Math.floor(Date.now() / 1000) + 3600
  const putPolicy = JSON.stringify({ scope: bucket, deadline })
  const encodedPutPolicy = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(putPolicy)
  ).replace(/\+/g, '-').replace(/\//g, '_')
  const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey).toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-').replace(/\//g, '_')
  return `${accessKey}:${sign}:${encodedPutPolicy}`
}

// ═══════════════════════════════════════════════════════════════
// S3 兼容图床 — 各图床上传函数
// ═══════════════════════════════════════════════════════════════

// --- 阿里云 OSS ---
// 签名：HmacSHA1，Auth 前缀 OSS
async function uploadToAliyunOSS(
  file: File,
  config: AliyunOSSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config
  if (!accessKeyId || !accessKeySecret || !bucket || !region)
    return { success: false, error: '请完善阿里云 OSS 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到阿里云 OSS...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const contentType = file.type || 'application/octet-stream'
  const authorization = signSimplePut({
    bucket, objectKey, contentType, date, secretKey: accessKeySecret,
    hmacMethod: 'sha1', authPrefix: 'OSS', accessKey: accessKeyId,
  })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}`,
    headers: { 'Content-Type': contentType, Date: date, Authorization: authorization },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 腾讯云 COS ---
// 签名：独特签名链，authorization 放 query string
async function uploadToTencentCOS(
  file: File,
  config: TencentCOSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { secretId, secretKey, bucket, region, customDomain, pathPrefix } = config
  if (!secretId || !secretKey || !bucket || !region)
    return { success: false, error: '请完善腾讯云 COS 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到腾讯云 COS...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.cos.${region}.myqcloud.com`
  const contentType = file.type || 'application/octet-stream'
  const authorization = signTencentCOS({ secretId, secretKey, host, objectKey })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}?${authorization}`,
    headers: { Host: host, 'Content-Type': contentType },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 七牛云 ---
// 签名：上传凭证，POST FormData
async function uploadToQiniu(
  file: File,
  config: QiniuConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKey, secretKey, bucket, domain, pathPrefix } = config
  if (!accessKey || !secretKey || !bucket || !domain)
    return { success: false, error: '请完善七牛云配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到七牛云...' })

  const key = generateUniqueFilename(file.name, pathPrefix)
  const uploadToken = generateQiniuToken({ accessKey, secretKey, bucket })
  const formData = new FormData()
  formData.append('token', uploadToken)
  formData.append('key', key)
  formData.append('file', file)

  return xhrUpload({
    method: 'POST',
    url: 'https://upload.qiniup.com',
    formData,
    extractUrl: (text) => {
      const r = JSON.parse(text)
      return domain.startsWith('http') ? `${domain}/${r.key}` : `https://${domain}/${r.key}`
    },
    onProgress,
  })
}

// --- AWS S3 ---
// 签名：AWS Signature Version 4
async function uploadToAWSS3(
  file: File,
  config: AWSS3Config,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, secretAccessKey, bucket, region, customDomain, pathPrefix } = config
  if (!accessKeyId || !secretAccessKey || !bucket || !region)
    return { success: false, error: '请完善 AWS S3 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到 AWS S3...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.s3.${region}.amazonaws.com`
  const contentType = file.type || 'application/octet-stream'
  const { authorization, extraHeaders } = signAWSS3({ accessKeyId, secretAccessKey, region, host, objectKey })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}`,
    headers: { Host: host, 'Content-Type': contentType, Authorization: authorization, ...extraHeaders },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 又拍云 ---
// 签名：MD5(operator&password)，固定签名
async function uploadToUpyun(
  file: File,
  config: UpyunConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { operator, password, bucket, domain, pathPrefix } = config
  if (!operator || !password || !bucket || !domain)
    return { success: false, error: '请完善又拍云配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到又拍云...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const date = new Date().toUTCString()
  const signature = CryptoJS.MD5(`${operator}&${password}`).toString()
  const authorization = `UPYUN ${operator}:${signature}`
  const url = domain.startsWith('http') ? `${domain}/${objectKey}` : `https://${domain}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://v0.api.upyun.com/${bucket}/${objectKey}`,
    headers: { Date: date, Authorization: authorization },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 华为云 OBS ---
// 签名：HmacSHA1，Auth 前缀 OBS（与阿里云签名逻辑相同，host 不同）
async function uploadToHuaweiOBS(
  file: File,
  config: HuaweiOBSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config
  if (!accessKeyId || !accessKeySecret || !bucket || !region)
    return { success: false, error: '请完善华为云 OBS 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到华为云 OBS...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.obs.${region}.myhuaweicloud.com`
  const date = new Date().toUTCString()
  const contentType = file.type || 'application/octet-stream'
  const authorization = signSimplePut({
    bucket, objectKey, contentType, date, secretKey: accessKeySecret,
    hmacMethod: 'sha1', authPrefix: 'OBS', accessKey: accessKeyId,
  })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}`,
    headers: { 'Content-Type': contentType, Date: date, Authorization: authorization },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 网易云 NOS ---
// 签名：HmacSHA256，Auth 前缀 NOS
async function uploadToNeteaseNOS(
  file: File,
  config: NeteaseNOSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config
  if (!accessKeyId || !accessKeySecret || !bucket || !region)
    return { success: false, error: '请完善网易云 NOS 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到网易云 NOS...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.nos-${region}.126.net`
  const date = new Date().toUTCString()
  const contentType = file.type || 'application/octet-stream'
  const authorization = signSimplePut({
    bucket, objectKey, contentType, date, secretKey: accessKeySecret,
    hmacMethod: 'sha256', authPrefix: 'NOS', accessKey: accessKeyId,
  })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}`,
    headers: { 'Content-Type': contentType, Date: date, Authorization: authorization },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// --- 京东云 OSS ---
// 签名：HmacSHA1，Auth 前缀 AWS
async function uploadToJDOSS(
  file: File,
  config: JDOSSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config
  if (!accessKeyId || !accessKeySecret || !bucket || !region)
    return { success: false, error: '请完善京东云 OSS 配置' }

  onProgress?.({ isUploading: true, progress: 0, statusText: '正在上传到京东云 OSS...' })

  const objectKey = generateUniqueFilename(file.name, pathPrefix)
  const host = `${bucket}.oss.${region}.jdcloud-oss.com`
  const date = new Date().toUTCString()
  const contentType = file.type || 'application/octet-stream'
  const authorization = signSimplePut({
    bucket, objectKey, contentType, date, secretKey: accessKeySecret,
    hmacMethod: 'sha1', authPrefix: 'AWS', accessKey: accessKeyId,
  })
  const url = customDomain ? `https://${customDomain}/${objectKey}` : `https://${host}/${objectKey}`

  return xhrUpload({
    method: 'PUT',
    url: `https://${host}/${objectKey}`,
    headers: { 'Content-Type': contentType, Date: date, Authorization: authorization },
    body: await fileToArrayBuffer(file),
    extractUrl: () => url,
    onProgress,
  })
}

// ═══════════════════════════════════════════════════════════════
// 入口函数
// ═══════════════════════════════════════════════════════════════

/**
 * 上传图片到图床
 * @param file 图片文件
 * @param hostType 图床类型
 * @param config 图床配置
 * @param onProgress 进度回调
 */
export async function uploadImage(
  file: File,
  hostType: ImageHostType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return { success: false, error: '只支持上传图片文件' }
  }

  // 检查文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { success: false, error: '图片大小不能超过 10MB' }
  }

  // 根据图床类型调用对应的上传函数
  switch (hostType) {
    case 'dk':
      return uploadToTraditionalHost(file, hostType, config?.token, onProgress)
    case 'bolt':
      return uploadToBolt(file, config?.token, onProgress)

    case 'imgbb':
      return uploadToImgBB(file, onProgress)

    case 'freeimage':
      return uploadToFreeImage(file, onProgress)

    case 'kappa':
      return uploadToKappa(file, onProgress)

    case 'lewd':
      return uploadToLewd(file, onProgress)

    case 'smms': {
      const smmsToken = (config as { token?: string }).token || ''
      return uploadToSmms(file, smmsToken, onProgress)
    }

    case 'aliyun':
      return uploadToAliyunOSS(file, config, onProgress)

    case 'tencent':
      return uploadToTencentCOS(file, config, onProgress)

    case 'qiniu':
      return uploadToQiniu(file, config, onProgress)

    case 'aws':
      return uploadToAWSS3(file, config, onProgress)

    case 'upyun':
      return uploadToUpyun(file, config, onProgress)

    case 'huawei':
      return uploadToHuaweiOBS(file, config, onProgress)

    case 'netease':
      return uploadToNeteaseNOS(file, config, onProgress)

    case 'jd':
      return uploadToJDOSS(file, config, onProgress)

    default:
      return { success: false, error: '不支持的图床类型' }
  }
}

/**
 * 将 File 转换为 Base64（用于预览）
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}
