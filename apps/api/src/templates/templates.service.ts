import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplatesService {
  async createTemplate(body: any) {
    return { id: 'template_1', ...body, createdAt: new Date().toISOString() };
  }

  async listTemplates(type?: string) {
    const templates = [
      { id: 'template_1', name: 'Tech Carousel', type: 'carousel', frames: 5 },
      { id: 'template_2', name: 'Product Thumbnail', type: 'thumbnail', textPreset: 'bold' },
      { id: 'template_3', name: 'Story Caption', type: 'caption', shell: 'question_hook' },
    ];
    
    if (type) {
      return templates.filter(t => t.type === type);
    }
    return templates;
  }

  async getTemplate(id: string) {
    return {
      id,
      name: 'Tech Carousel',
      type: 'carousel',
      frames: [
        { position: 1, text: 'Frame 1', imagePlaceholder: 'hero.jpg' },
        { position: 2, text: 'Frame 2', imagePlaceholder: 'feature.jpg' },
        { position: 3, text: 'Frame 3', imagePlaceholder: 'benefit.jpg' },
      ],
    };
  }
}
