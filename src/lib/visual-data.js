export function toVisualData(media) {
  return media.map((item, index) => ({
    id: `cloudinary-${item.public_id}`,
    cloudinaryId: item.public_id,
    imageUrl: item.url, // 图片URL
    videoUrl: item.mediaType === 'video' ? item.url : null, // 视频URL
    mediaType: item.mediaType, // 'image' 或 'video'
    sourceType: item.sourceType, // 'photography' 或 'aigc'
    aspectRatio: item.aspect_ratio,
    // 优先使用用户设置的元数据，fallback到默认值
    title: item.title || `${getMediaTypeLabel(item.mediaType, item.sourceType)} ${index + 1}`,
    description: item.description || `${getMediaTypeDescription(item.mediaType, item.sourceType)}`,
    location: item.location || '',
    camera: item.camera || '',
    capturedAt: item.capturedAt || null, // 拍摄时间
    tags: item.tags && item.tags.length > 0 ? item.tags : generateTags(item.sourceType, item.mediaType),
    timestamp: item.created_at,
    duration: item.duration, // 视频时长
    category: item.category, // 原始分类：photograph、video、ai_photo、ai_video
    // 保存原始资源信息
    originalResource: item
  }))
}

// 辅助函数：获取媒体类型标签
function getMediaTypeLabel(mediaType, sourceType) {
  if (mediaType === 'image') {
    return sourceType === 'aigc' ? 'AI Image' : 'Photography'
  } else {
    return sourceType === 'aigc' ? 'AI Video' : 'Video'
  }
}

// 辅助函数：获取媒体类型描述
function getMediaTypeDescription(mediaType, sourceType) {
  if (mediaType === 'image') {
    return sourceType === 'aigc'
      ? 'AI-generated visual artwork from your creative collection'
      : 'Beautiful photography from your personal collection'
  } else {
    return sourceType === 'aigc'
      ? 'AI-generated video content from your creative collection'
      : 'Video content from your personal collection'
  }
}

// 辅助函数：生成标签
function generateTags(sourceType, mediaType) {
  const tags = []

  if (sourceType === 'photography') {
    tags.push('Photography')
  } else {
    tags.push('AI Generated')
  }

  if (mediaType === 'image') {
    tags.push('Image')
  } else {
    tags.push('Video')
  }

  tags.push('Personal Collection', 'Cloudinary')

  return tags
}
