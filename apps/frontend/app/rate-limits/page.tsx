'use client';
import React from 'react';
import RateLimitMonitor from '../../components/RateLimitMonitor';

export default function RateLimitsPage() {
  // In a real app, this would come from user context or route params
  const organizationId = '123'; // Mock organization ID

  return <RateLimitMonitor organizationId={organizationId} />;
}
