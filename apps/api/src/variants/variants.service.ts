import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Variant } from './entities/variant.entity';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(Variant)
    private variantsRepository: Repository<Variant>,
  ) {}

  async findByPost(postId: string): Promise<Variant[]> {
    return this.variantsRepository.find({ where: { postId } });
  }

  async scoreVariant(id: string, score: Variant['score']): Promise<Variant> {
    const variant = await this.variantsRepository.findOne({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.score = score;
    return this.variantsRepository.save(variant);
  }

  async rewrite(id: string, newContent: string): Promise<Variant> {
    const variant = await this.variantsRepository.findOne({ where: { id } });
    if (!variant) throw new NotFoundException('Variant not found');
    variant.content = newContent;
    return this.variantsRepository.save(variant);
  }
}


