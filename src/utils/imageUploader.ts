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

// ═══════════════════════════════════════════════════════════════
// 传统图床上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到传统图床 (DK/Bolt)
 */
async function uploadToTraditionalHost(
  file: File,
  hostType: 'dk' | 'bolt',
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const hostInfo = IMAGE_HOSTS[hostType]

  if (!hostInfo) {
    return { success: false, error: '不支持的图床类型' }
  }

  if (HOST_REQUIRES_TOKEN[hostType] && !token) {
    return { success: false, error: '请先配置图床 Token' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传...',
  })

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    if (HOST_REQUIRES_TOKEN[hostType] && token) {
      formData.append('token', token)
    }
    formData.append('file', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress?.({
          isUploading: true,
          progress,
          statusText: `上传中 ${progress}%`,
        })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          let imageUrl: string | undefined

          if (response.url) {
            imageUrl = response.url
          } else if (response.data?.url) {
            imageUrl = response.data.url
          } else if (response.links?.original) {
            imageUrl = response.links.original
          }

          if (imageUrl) {
            onProgress?.({
              isUploading: false,
              progress: 100,
              statusText: '上传成功',
            })
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

    xhr.timeout = 60000
    xhr.open('POST', hostInfo.links.official + '/api/v1/upload')
    xhr.send(formData)
  })
}

// ═══════════════════════════════════════════════════════════════
// 阿里云 OSS 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到阿里云 OSS
 * 使用 POST 签名方式上传
 */
async function uploadToAliyunOSS(
  file: File,
  config: AliyunOSSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return { success: false, error: '请完善阿里云 OSS 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到阿里云 OSS...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const endpoint = `https://${bucket}.${region}.aliyuncs.com`
    const date = new Date().toUTCString()
    const contentType = file.type || 'application/octet-stream'

    // 计算 PUT 签名
    const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${objectKey}`
    const signature = CryptoJS.HmacSHA1(stringToSign, accessKeySecret).toString(CryptoJS.enc.Base64)
    const authorization = `OSS ${accessKeyId}:${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `${endpoint}/${objectKey}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('Date', date)
      xhr.setRequestHeader('Authorization', authorization)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 腾讯云 COS 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到腾讯云 COS
 */
async function uploadToTencentCOS(
  file: File,
  config: TencentCOSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { secretId, secretKey, bucket, region, customDomain, pathPrefix } = config

  if (!secretId || !secretKey || !bucket || !region) {
    return { success: false, error: '请完善腾讯云 COS 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到腾讯云 COS...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const host = `${bucket}.cos.${region}.myqcloud.com`
    const date = new Date()
    const contentType = file.type || 'application/octet-stream'

    // 计算签名
    const keyTime = `${Math.floor(date.getTime() / 1000)};${Math.floor(date.getTime() / 1000) + 3600}`
    const signKey = CryptoJS.HmacSHA1(keyTime, secretKey).toString()
    const httpString = `put\n/${objectKey}\n\nhost=${host}\n`
    const stringToSign = `sha1\n${keyTime}\n${CryptoJS.SHA1(httpString).toString()}\n`
    const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString()

    const authorization = [
      `q-sign-algorithm=sha1`,
      `q-ak=${secretId}`,
      `q-sign-time=${keyTime}`,
      `q-key-time=${keyTime}`,
      `q-header-list=host`,
      `q-url-param-list=`,
      `q-signature=${signature}`,
    ].join('&')

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${host}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://${host}/${objectKey}?${authorization}`)
      xhr.setRequestHeader('Host', host)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 七牛云上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到七牛云
 */
async function uploadToQiniu(
  file: File,
  config: QiniuConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKey, secretKey, bucket, domain, pathPrefix } = config

  if (!accessKey || !secretKey || !bucket || !domain) {
    return { success: false, error: '请完善七牛云配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到七牛云...',
  })

  try {
    const key = generateUniqueFilename(file.name, pathPrefix)
    const deadline = Math.floor(Date.now() / 1000) + 3600

    // 生成上传凭证
    const putPolicy = JSON.stringify({ scope: bucket, deadline })
    const encodedPutPolicy = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(putPolicy)
    ).replace(/\+/g, '-').replace(/\//g, '_')
    const sign = CryptoJS.HmacSHA1(encodedPutPolicy, secretKey).toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-').replace(/\//g, '_')
    const uploadToken = `${accessKey}:${sign}:${encodedPutPolicy}`

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('token', uploadToken)
      formData.append('key', key)
      formData.append('file', file)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            const url = domain.startsWith('http') ? `${domain}/${response.key}` : `https://${domain}/${response.key}`
            onProgress?.({
              isUploading: false,
              progress: 100,
              statusText: '上传成功',
            })
            resolve({ success: true, url })
          } catch {
            resolve({ success: false, error: '解析响应失败' })
          }
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('POST', 'https://upload.qiniup.com')
      xhr.send(formData)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// AWS S3 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到 AWS S3
 */
async function uploadToAWSS3(
  file: File,
  config: AWSS3Config,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, secretAccessKey, bucket, region, customDomain, pathPrefix } = config

  if (!accessKeyId || !secretAccessKey || !bucket || !region) {
    return { success: false, error: '请完善 AWS S3 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到 AWS S3...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const host = `${bucket}.s3.${region}.amazonaws.com`
    const contentType = file.type || 'application/octet-stream'

    // 计算 AWS Signature Version 4
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.substring(0, 8)

    const canonicalRequest = `PUT\n/${objectKey}\n\nhost:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n\nhost;x-amz-content-sha256;x-amz-date\nUNSIGNED-PAYLOAD`
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/s3/aws4_request\n${CryptoJS.SHA256(canonicalRequest).toString()}`

    const kDate = CryptoJS.HmacSHA256(dateStamp, `AWS4${secretAccessKey}`)
    const kRegion = CryptoJS.HmacSHA256(region, kDate)
    const kService = CryptoJS.HmacSHA256('s3', kRegion)
    const kSigning = CryptoJS.HmacSHA256('aws4_request', kService)
    const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString()

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${host}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://${host}/${objectKey}`)
      xhr.setRequestHeader('Host', host)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('x-amz-date', amzDate)
      xhr.setRequestHeader('x-amz-content-sha256', 'UNSIGNED-PAYLOAD')
      xhr.setRequestHeader('Authorization', authorization)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 又拍云上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到又拍云
 */
async function uploadToUpyun(
  file: File,
  config: UpyunConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { operator, password, bucket, domain, pathPrefix } = config

  if (!operator || !password || !bucket || !domain) {
    return { success: false, error: '请完善又拍云配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到又拍云...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const date = new Date().toUTCString()
    const signature = CryptoJS.MD5(`${operator}&${password}`).toString()
    const authorization = `UPYUN ${operator}:${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = domain.startsWith('http') ? `${domain}/${objectKey}` : `https://${domain}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://v0.api.upyun.com/${bucket}/${objectKey}`)
      xhr.setRequestHeader('Authorization', authorization)
      xhr.setRequestHeader('Date', date)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 华为云 OBS 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到华为云 OBS
 */
async function uploadToHuaweiOBS(
  file: File,
  config: HuaweiOBSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return { success: false, error: '请完善华为云 OBS 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到华为云 OBS...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const host = `${bucket}.obs.${region}.myhuaweicloud.com`
    const date = new Date().toUTCString()
    const contentType = file.type || 'application/octet-stream'

    // 计算签名
    const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${objectKey}`
    const signature = CryptoJS.HmacSHA1(stringToSign, accessKeySecret).toString(CryptoJS.enc.Base64)
    const authorization = `OBS ${accessKeyId}:${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${host}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://${host}/${objectKey}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('Date', date)
      xhr.setRequestHeader('Authorization', authorization)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 网易云 NOS 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到网易云 NOS
 */
async function uploadToNeteaseNOS(
  file: File,
  config: NeteaseNOSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return { success: false, error: '请完善网易云 NOS 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到网易云 NOS...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const host = `${bucket}.nos-${region}.126.net`
    const date = new Date().toUTCString()
    const contentType = file.type || 'application/octet-stream'

    // 计算签名
    const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${objectKey}`
    const signature = CryptoJS.HmacSHA256(stringToSign, accessKeySecret).toString(CryptoJS.enc.Base64)
    const authorization = `NOS ${accessKeyId}:${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${host}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://${host}/${objectKey}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('Date', date)
      xhr.setRequestHeader('Authorization', authorization)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 京东云 OSS 上传
// ═══════════════════════════════════════════════════════════════

/**
 * 上传到京东云 OSS
 */
async function uploadToJDOSS(
  file: File,
  config: JDOSSConfig,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { accessKeyId, accessKeySecret, bucket, region, customDomain, pathPrefix } = config

  if (!accessKeyId || !accessKeySecret || !bucket || !region) {
    return { success: false, error: '请完善京东云 OSS 配置' }
  }

  onProgress?.({
    isUploading: true,
    progress: 0,
    statusText: '正在上传到京东云 OSS...',
  })

  try {
    const objectKey = generateUniqueFilename(file.name, pathPrefix)
    const host = `${bucket}.oss.${region}.jdcloud-oss.com`
    const date = new Date().toUTCString()
    const contentType = file.type || 'application/octet-stream'

    // 计算签名
    const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${objectKey}`
    const signature = CryptoJS.HmacSHA1(stringToSign, accessKeySecret).toString(CryptoJS.enc.Base64)
    const authorization = `AWS ${accessKeyId}:${signature}`

    const arrayBuffer = await fileToArrayBuffer(file)

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress?.({
            isUploading: true,
            progress,
            statusText: `上传中 ${progress}%`,
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = customDomain
            ? `https://${customDomain}/${objectKey}`
            : `https://${host}/${objectKey}`
          onProgress?.({
            isUploading: false,
            progress: 100,
            statusText: '上传成功',
          })
          resolve({ success: true, url })
        } else {
          resolve({ success: false, error: `上传失败: ${xhr.status}` })
        }
      })

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: '网络错误' })
      })

      xhr.timeout = 120000
      xhr.open('PUT', `https://${host}/${objectKey}`)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('Date', date)
      xhr.setRequestHeader('Authorization', authorization)
      xhr.send(arrayBuffer)
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '上传失败' }
  }
}

// ═══════════════════════════════════════════════════════════════
// 统一上传接口
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
    case 'bolt':
      return uploadToTraditionalHost(file, hostType, config?.token, onProgress)

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
