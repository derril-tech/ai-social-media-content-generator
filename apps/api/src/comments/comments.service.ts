import { Injectable } from '@nestjs/common';

@Injectable()
export class CommentsService {
  async createComment(body: any) {
    return { id: 'comment_1', ...body, createdAt: new Date().toISOString() };
  }

  async listComments(postId: string) {
    return [
      { id: 'comment_1', postId, text: 'Great post!', author: 'user_1', mentions: ['user_2'] },
      { id: 'comment_2', postId, text: '@user_1 thanks!', author: 'user_2', parentId: 'comment_1' },
    ];
  }

  async resolveThread(threadId: string) {
    // TODO: Mark thread as resolved
    return { threadId, status: 'resolved', resolvedAt: new Date().toISOString() };
  }

  async mentionUsers(commentId: string, userIds: string[]) {
    // TODO: Process mentions and notify users
    return { commentId, mentions: userIds, notified: true };
  }
}
