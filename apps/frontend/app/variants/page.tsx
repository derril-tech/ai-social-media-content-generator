import VariantTable from '@/components/VariantTable'
import Layout from '@/components/Layout'

// Mock data - in real app this would come from API
const mockVariants = [
  {
    id: '1',
    content: '🚀 Exciting news! Our new AI-powered social media tool is here to revolutionize your content strategy.',
    platform: 'Twitter',
    scores: {
      brandFit: 0.85,
      readability: 0.92,
      policyRisk: 0.05,
      overall: 0.87,
    },
    riskLevel: 'low' as const,
  },
  {
    id: '2',
    content: 'Transform your social media presence with our cutting-edge AI content generator. Boost engagement and save time!',
    platform: 'LinkedIn',
    scores: {
      brandFit: 0.78,
      readability: 0.88,
      policyRisk: 0.12,
      overall: 0.82,
    },
    riskLevel: 'low' as const,
  },
  {
    id: '3',
    content: '🔥 Hot take: AI is changing social media forever. Are you ready to adapt?',
    platform: 'Instagram',
    scores: {
      brandFit: 0.65,
      readability: 0.75,
      policyRisk: 0.25,
      overall: 0.70,
    },
    riskLevel: 'medium' as const,
  },
]

export default function VariantsPage() {
  const handleVariantUpdate = (id: string, updates: any) => {
    // TODO: Call API to update variant
    console.log(`Variant ${id} updated:`, updates)
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Variants</h1>
        <p className="text-gray-600 mt-2">
          Review and edit your AI-generated content variants
        </p>
      </div>
      
      <VariantTable 
        variants={mockVariants} 
        onVariantUpdate={handleVariantUpdate}
      />
    </Layout>
  )
}
