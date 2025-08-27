'use client'

import { useState } from 'react'

interface UTMParams {
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}

interface UTMBuilderProps {
  baseUrl: string
  onUrlChange: (url: string) => void
}

export default function UTMBuilder({ baseUrl, onUrlChange }: UTMBuilderProps) {
  const [utmParams, setUtmParams] = useState<UTMParams>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  })

  const [shortenedUrl, setShortenedUrl] = useState('')
  const [isShortening, setIsShortening] = useState(false)

  const presets = [
    {
      name: 'Social Media Campaign',
      params: {
        source: 'social',
        medium: 'social',
        campaign: 'summer2024',
        content: 'post1',
      },
    },
    {
      name: 'Email Newsletter',
      params: {
        source: 'email',
        medium: 'email',
        campaign: 'newsletter',
        content: 'weekly',
      },
    },
    {
      name: 'Google Ads',
      params: {
        source: 'google',
        medium: 'cpc',
        campaign: 'branded',
        term: 'ai tools',
      },
    },
    {
      name: 'Facebook Ads',
      params: {
        source: 'facebook',
        medium: 'cpc',
        campaign: 'awareness',
        content: 'video1',
      },
    },
  ]

  const buildUTMUrl = (params: UTMParams) => {
    const url = new URL(baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value)
      }
    })
    return url.toString()
  }

  const handleParamChange = (key: keyof UTMParams, value: string) => {
    const newParams = { ...utmParams, [key]: value }
    setUtmParams(newParams)
    const url = buildUTMUrl(newParams)
    onUrlChange(url)
  }

  const applyPreset = (preset: typeof presets[0]) => {
    setUtmParams(preset.params)
    const url = buildUTMUrl(preset.params)
    onUrlChange(url)
  }

  const shortenUrl = async (url: string) => {
    setIsShortening(true)
    try {
      // TODO: Call actual shortening service
      await new Promise(resolve => setTimeout(resolve, 1000))
      const shortUrl = `https://short.ly/${Math.random().toString(36).substr(2, 6)}`
      setShortenedUrl(shortUrl)
    } catch (error) {
      console.error('Error shortening URL:', error)
    } finally {
      setIsShortening(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const currentUrl = buildUTMUrl(utmParams)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">UTM Builder</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source (utm_source)
            </label>
            <input
              type="text"
              value={utmParams.source}
              onChange={(e) => handleParamChange('source', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="google, facebook, email, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medium (utm_medium)
            </label>
            <input
              type="text"
              value={utmParams.medium}
              onChange={(e) => handleParamChange('medium', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="cpc, social, email, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign (utm_campaign)
            </label>
            <input
              type="text"
              value={utmParams.campaign}
              onChange={(e) => handleParamChange('campaign', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="summer2024, newsletter, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term (utm_term)
            </label>
            <input
              type="text"
              value={utmParams.term}
              onChange={(e) => handleParamChange('term', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="keyword, search term"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content (utm_content)
            </label>
            <input
              type="text"
              value={utmParams.content}
              onChange={(e) => handleParamChange('content', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="post1, video1, banner1, etc."
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Presets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-600">
                  {preset.params.source} / {preset.params.medium} / {preset.params.campaign}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Generated URL</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentUrl}
                readOnly
                className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50"
              />
              <button
                onClick={() => copyToClipboard(currentUrl)}
                className="btn-primary"
              >
                Copy
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => shortenUrl(currentUrl)}
                disabled={isShortening}
                className="btn-secondary"
              >
                {isShortening ? 'Shortening...' : 'Shorten URL'}
              </button>
              {shortenedUrl && (
                <>
                  <input
                    type="text"
                    value={shortenedUrl}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(shortenedUrl)}
                    className="btn-primary"
                  >
                    Copy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">UTM Parameters Guide</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Source:</strong> Where the traffic comes from (google, facebook, email)</li>
            <li><strong>Medium:</strong> Marketing medium (cpc, social, email, banner)</li>
            <li><strong>Campaign:</strong> Specific campaign name (summer2024, newsletter)</li>
            <li><strong>Term:</strong> Keywords for paid search</li>
            <li><strong>Content:</strong> A/B testing or content variation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
