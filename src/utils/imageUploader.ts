/**
 * 图片上传工具函数
 * 支持上传到多个图床服务
 */

import { IMAGE_HOSTS, HOST_REQUIRES_TOKEN, type ImageHostType, type UploadProgress, type UploadResult } from '../types/imageHost'

/**
 * 上传图片到图床
 * @param file 图片文件
 * @param hostType 图床类型
 * @param token API Token（闪电图床不需要）
 * @param onProgress 进度回调
 */
export function uploadImage(
  file: File,
  hostType: ImageHostType,
  token?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const hostInfo = IMAGE_HOSTS[hostType]

    if (!hostInfo) {
      resolve({ success: false, error: '不支持的图床类型' })
      return
    }

    // 只有需要 token 的图床才检查
    if (HOST_REQUIRES_TOKEN[hostType] && !token) {
      resolve({ success: false, error: '请先配置图床 Token' })
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      resolve({ success: false, error: '只支持上传图片文件' })
      return
    }

    // 检查文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      resolve({ success: false, error: '图片大小不能超过 10MB' })
      return
    }

    onProgress?.({
      isUploading: true,
      progress: 0,
      statusText: '正在上传...',
    })

    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    // 构建 FormData
    // 只有需要 token 的图床才添加 token 字段
    if (HOST_REQUIRES_TOKEN[hostType] && token) {
      formData.append('token', token)
    }
    formData.append('file', file)

    // 监听上传进度
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

    // 监听请求完成
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)

          // 检查不同图床的响应格式
          let imageUrl: string | undefined

          if (response.url) {
            // Hello图床/DK图床格式
            imageUrl = response.url
          } else if (response.data?.url) {
            // 闪电图床格式
            imageUrl = response.data.url
          } else if (response.links?.original) {
            // 其他可能的格式
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
            onProgress?.({
              isUploading: false,
              progress: 0,
              statusText: '上传失败',
            })
            resolve({ success: false, error: '响应格式错误，未获取到图片链接' })
          }
        } catch {
          onProgress?.({
            isUploading: false,
            progress: 0,
            statusText: '解析响应失败',
          })
          resolve({ success: false, error: '解析服务器响应失败' })
        }
      } else {
        let errorMsg = `上传失败 (${xhr.status})`

        try {
          const errorResponse = JSON.parse(xhr.responseText)
          if (errorResponse.message) {
            errorMsg = errorResponse.message
          } else if (errorResponse.error) {
            errorMsg = errorResponse.error
          } else if (errorResponse.msg) {
            errorMsg = errorResponse.msg
          }
        } catch {
          // 无法解析错误响应
        }

        onProgress?.({
          isUploading: false,
          progress: 0,
          statusText: '上传失败',
        })
        resolve({ success: false, error: errorMsg })
      }
    })

    // 监听网络错误
    xhr.addEventListener('error', () => {
      onProgress?.({
        isUploading: false,
        progress: 0,
        statusText: '网络错误',
      })
      resolve({ success: false, error: '网络错误，请检查网络连接' })
    })

    // 监听超时
    xhr.addEventListener('timeout', () => {
      onProgress?.({
        isUploading: false,
        progress: 0,
        statusText: '上传超时',
      })
      resolve({ success: false, error: '上传超时，请重试' })
    })

    // 设置超时时间（60秒）
    xhr.timeout = 60000

    // 发送请求
    xhr.open('POST', hostInfo.apiUrl)
    xhr.send(formData)
  })
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
