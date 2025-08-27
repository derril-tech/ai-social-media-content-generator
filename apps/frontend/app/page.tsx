import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Social Media Content Generator
        </h1>
        <p className="text-xl text-gray-600">
          Generate, manage, and publish social media content with AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Campaigns</h3>
          <p className="text-gray-600 mb-4">Create and manage your social media campaigns</p>
          <Link href="/campaigns" className="btn-primary inline-block">
            View Campaigns
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Content Generation</h3>
          <p className="text-gray-600 mb-4">Generate AI-powered content for multiple platforms</p>
          <Link href="/generate" className="btn-primary inline-block">
            Generate Content
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Calendar</h3>
          <p className="text-gray-600 mb-4">Schedule and manage your content calendar</p>
          <Link href="/calendar" className="btn-primary inline-block">
            View Calendar
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-gray-600 mb-4">Track performance and engagement metrics</p>
          <Link href="/analytics" className="btn-primary inline-block">
            View Analytics
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Brands</h3>
          <p className="text-gray-600 mb-4">Manage your brand guidelines and voice</p>
          <Link href="/brands" className="btn-primary inline-block">
            Manage Brands
          </Link>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Connectors</h3>
          <p className="text-gray-600 mb-4">Connect your social media accounts</p>
          <Link href="/connectors" className="btn-primary inline-block">
            Setup Connectors
          </Link>
        </div>
      </div>
    </div>
  )
}
