import ShareLinkManager from '../../components/ShareLinkManager';

export default function ShareLinksPage() {
  // In a real app, this would come from authentication context
  const organizationId = 'org-12345678';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ShareLinkManager organizationId={organizationId} />
    </div>
  );
}
