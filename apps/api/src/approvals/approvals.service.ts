import { Injectable } from '@nestjs/common';

@Injectable()
export class ApprovalsService {
  async createApprovalRequest(body: any) {
    return { 
      id: 'approval_1', 
      ...body, 
      status: 'pending',
      createdAt: new Date().toISOString() 
    };
  }

  async approvePost(approvalId: string, reviewerId: string) {
    // TODO: Update approval status and trigger publish workflow
    return { 
      approvalId, 
      reviewerId, 
      status: 'approved',
      approvedAt: new Date().toISOString() 
    };
  }

  async rejectPost(approvalId: string, reviewerId: string, reason: string) {
    return { 
      approvalId, 
      reviewerId, 
      status: 'rejected',
      reason,
      rejectedAt: new Date().toISOString() 
    };
  }

  async getPendingApprovals(organizationId: string) {
    return [
      {
        id: 'approval_1',
        postId: 'post_1',
        requesterId: 'user_1',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getApprovalHistory(resourceId: string) {
    return [
      {
        id: 'approval_1',
        resourceId,
        status: 'approved',
        reviewerId: 'user_2',
        approvedAt: new Date().toISOString(),
      },
    ];
  }
}
