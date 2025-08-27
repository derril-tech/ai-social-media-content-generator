'use client'

import { useState } from 'react'

interface PlatformPreviewProps {
  content: string
  platform: string
  onContentChange: (content: string) => void
}

interface LintRule {
  id: string
  message: string
  severity: 'error' | 'warning' | 'info'
  position: { start: number; end: number }
}

export default function PlatformPreview({ content, platform, onContentChange }: PlatformPreviewProps) {
  const [lints, setLints] = useState<LintRule[]>([])

  const platformConfig = {
    twitter: {
      maxLength: 280,
      name: 'Twitter/X',
      icon: '🐦',
      previewStyle: 'bg-black text-white p-4 rounded-lg font-sans',
    },
    linkedin: {
      maxLength: 3000,
      name: 'LinkedIn',
      icon: '💼',
      previewStyle: 'bg-blue-600 text-white p-4 rounded-lg font-sans',
    },
    instagram: {
      maxLength: 2200,
      name: 'Instagram',
      icon: '📸',
      previewStyle: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg font-sans',
    },
    facebook: {
      maxLength: 63206,
      name: 'Facebook',
      icon: '📘',
      previewStyle: 'bg-blue-800 text-white p-4 rounded-lg font-sans',
    },
    tiktok: {
      maxLength: 2200,
      name: 'TikTok',
      icon: '🎵',
      previewStyle: 'bg-black text-white p-4 rounded-lg font-sans',
    },
    youtube: {
      maxLength: 5000,
      name: 'YouTube',
      icon: '📺',
      previewStyle: 'bg-red-600 text-white p-4 rounded-lg font-sans',
    },
    pinterest: {
      maxLength: 500,
      name: 'Pinterest',
      icon: '📌',
      previewStyle: 'bg-red-500 text-white p-4 rounded-lg font-sans',
    },
  }

  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.twitter

  const checkLints = (text: string) => {
    const newLints: LintRule[] = []
    
    // Check length
    if (text.length > config.maxLength) {
      newLints.push({
        id: 'length',
        message: `Content exceeds ${config.maxLength} character limit (${text.length}/${config.maxLength})`,
        severity: 'error',
        position: { start: config.maxLength, end: text.length },
      })
    } else if (text.length > config.maxLength * 0.9) {
      newLints.push({
        id: 'length-warning',
        message: `Content is approaching character limit (${text.length}/${config.maxLength})`,
        severity: 'warning',
        position: { start: 0, end: 0 },
      })
    }

    // Check for hashtags
    const hashtagCount = (text.match(/#/g) || []).length
    if (hashtagCount > 30) {
      newLints.push({
        id: 'hashtags',
        message: 'Too many hashtags detected',
        severity: 'warning',
        position: { start: 0, end: 0 },
      })
    }

    // Check for mentions
    const mentionCount = (text.match(/@/g) || []).length
    if (mentionCount > 10) {
      newLints.push({
        id: 'mentions',
        message: 'Too many mentions detected',
        severity: 'warning',
        position: { start: 0, end: 0 },
      })
    }

    // Check for links
    const linkCount = (text.match(/https?:\/\/[^\s]+/g) || []).length
    if (linkCount > 5) {
      newLints.push({
        id: 'links',
        message: 'Too many links detected',
        severity: 'warning',
        position: { start: 0, end: 0 },
      })
    }

    setLints(newLints)
  }

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent)
    checkLints(newContent)
  }

  const getLintIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const getLintColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{config.icon}</span>
        <h3 className="text-lg font-semibold">{config.name} Preview</h3>
        <span className="text-sm text-gray-500">
          {content.length}/{config.maxLength} characters
        </span>
      </div>

      <div className={config.previewStyle}>
        <div className="whitespace-pre-wrap break-words">
          {content || 'Your content will appear here...'}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter your content here..."
        />
      </div>

      {lints.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Lints & Suggestions</h4>
          <div className="space-y-1">
            {lints.map((lint) => (
              <div key={lint.id} className={`flex items-center space-x-2 text-sm ${getLintColor(lint.severity)}`}>
                <span>{getLintIcon(lint.severity)}</span>
                <span>{lint.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
