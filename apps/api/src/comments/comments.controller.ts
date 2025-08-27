import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth('JWT-auth')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  @ApiResponse({ status: 201 })
  create(@Body() body: any) {
    return this.commentsService.createComment(body);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'List comments for post' })
  @ApiResponse({ status: 200 })
  listByPost(@Param('postId') postId: string) {
    return this.commentsService.listComments(postId);
  }

  @Put('thread/:threadId/resolve')
  @ApiOperation({ summary: 'Resolve comment thread' })
  @ApiResponse({ status: 200 })
  resolveThread(@Param('threadId') threadId: string) {
    return this.commentsService.resolveThread(threadId);
  }

  @Post(':commentId/mentions')
  @ApiOperation({ summary: 'Mention users in comment' })
  @ApiResponse({ status: 200 })
  mentionUsers(
    @Param('commentId') commentId: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.commentsService.mentionUsers(commentId, body.userIds);
  }
}
