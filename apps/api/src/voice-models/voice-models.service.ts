import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoiceModel, VoiceConstraints, TrainingExample } from './entities/voice-model.entity';
import { CreateVoiceModelDto, VoiceConstraintsDto } from './dto/create-voice-model.dto';
import { TrainVoiceModelDto } from './dto/train-voice-model.dto';
import { BrandsService } from '../brands/brands.service';
import { Tone } from '@shared/types';

@Injectable()
export class VoiceModelsService {
  constructor(
    @InjectRepository(VoiceModel)
    private voiceModelsRepository: Repository<VoiceModel>,
    private brandsService: BrandsService,
  ) {}

  async create(createVoiceModelDto: CreateVoiceModelDto, userId: string): Promise<VoiceModel> {
    const { brandId, constraints, trainingExamples } = createVoiceModelDto;

    // Verify user has access to the brand
    await this.brandsService.findOne(brandId, userId);

    // Check if voice model already exists for this brand
    const existingModel = await this.voiceModelsRepository.findOne({
      where: { brandId },
    });

    if (existingModel) {
      throw new BadRequestException('Voice model already exists for this brand');
    }

    // Set default constraints if not provided
    const defaultConstraints: VoiceConstraints = {
      tone: constraints?.tone || 'professional',
      sentenceLength: constraints?.sentenceLength || { min: 10, max: 150 },
      emojiThreshold: constraints?.emojiThreshold ?? 0.3,
      jargonThreshold: constraints?.jargonThreshold ?? 0.4,
      formalityLevel: constraints?.formalityLevel ?? 0.6,
      humorLevel: constraints?.humorLevel ?? 0.2,
      technicalLevel: constraints?.technicalLevel ?? 0.5,
      promotionalTone: constraints?.promotionalTone ?? 0.3,
    };

    const voiceModel = this.voiceModelsRepository.create({
      brandId,
      constraints: defaultConstraints,
      trainingExamples: trainingExamples || [],
      status: 'pending',
      trainingProgress: 0,
    });

    return this.voiceModelsRepository.save(voiceModel);
  }

  async findAll(userId: string): Promise<VoiceModel[]> {
    // Get user's accessible brands
    const userBrands = await this.brandsService.findAll(userId);
    const brandIds = userBrands.map(brand => brand.id);

    if (brandIds.length === 0) {
      return [];
    }

    return this.voiceModelsRepository.find({
      where: {
        brandId: brandIds as any,
      },
      relations: ['brand'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<VoiceModel> {
    const voiceModel = await this.voiceModelsRepository.findOne({
      where: { id },
      relations: ['brand'],
    });

    if (!voiceModel) {
      throw new NotFoundException(`Voice model with ID ${id} not found`);
    }

    // Verify user has access to the brand
    await this.brandsService.findOne(voiceModel.brandId, userId);

    return voiceModel;
  }

  async findByBrand(brandId: string, userId: string): Promise<VoiceModel | null> {
    // Verify user has access to the brand
    await this.brandsService.findOne(brandId, userId);

    return this.voiceModelsRepository.findOne({
      where: { brandId },
      relations: ['brand'],
    });
  }

  async train(id: string, trainVoiceModelDto: TrainVoiceModelDto, userId: string): Promise<VoiceModel> {
    const voiceModel = await this.findOne(id, userId);

    if (voiceModel.status === 'training') {
      throw new BadRequestException('Voice model is already being trained');
    }

    // Update training examples if provided
    if (trainVoiceModelDto.additionalExamples) {
      const existingExamples = voiceModel.trainingExamples || [];
      voiceModel.trainingExamples = [
        ...existingExamples,
        ...trainVoiceModelDto.additionalExamples,
      ];
    }

    // Update status to training
    voiceModel.status = 'training';
    voiceModel.trainingProgress = 0;
    voiceModel.errorMessage = null;

    const updatedModel = await this.voiceModelsRepository.save(voiceModel);

    // TODO: Queue the training job in the background
    // This would typically involve sending a message to a queue (NATS, Redis, etc.)
    // and having a worker process handle the actual training

    // For now, simulate the training process
    this.simulateTraining(updatedModel.id);

    return updatedModel;
  }

  async remove(id: string, userId: string): Promise<void> {
    const voiceModel = await this.findOne(id, userId);
    await this.voiceModelsRepository.remove(voiceModel);
  }

  async updateProgress(id: string, progress: number, status?: string): Promise<VoiceModel> {
    const voiceModel = await this.voiceModelsRepository.findOne({
      where: { id },
    });

    if (!voiceModel) {
      throw new NotFoundException(`Voice model with ID ${id} not found`);
    }

    voiceModel.trainingProgress = Math.max(0, Math.min(100, progress));

    if (status) {
      voiceModel.status = status as any;
    }

    if (status === 'completed') {
      voiceModel.trainedAt = new Date();
    }

    return this.voiceModelsRepository.save(voiceModel);
  }

  async updateEmbedding(id: string, embedding: number[], metrics?: any): Promise<VoiceModel> {
    const voiceModel = await this.voiceModelsRepository.findOne({
      where: { id },
    });

    if (!voiceModel) {
      throw new NotFoundException(`Voice model with ID ${id} not found`);
    }

    voiceModel.embedding = embedding;
    voiceModel.status = 'completed';
    voiceModel.trainedAt = new Date();
    voiceModel.trainingProgress = 100;

    if (metrics) {
      voiceModel.metrics = metrics;
    }

    return this.voiceModelsRepository.save(voiceModel);
  }

  async setError(id: string, errorMessage: string): Promise<VoiceModel> {
    const voiceModel = await this.voiceModelsRepository.findOne({
      where: { id },
    });

    if (!voiceModel) {
      throw new NotFoundException(`Voice model with ID ${id} not found`);
    }

    voiceModel.status = 'failed';
    voiceModel.errorMessage = errorMessage;
    voiceModel.trainingProgress = 0;

    return this.voiceModelsRepository.save(voiceModel);
  }

  // Simulate training process (replace with actual training in production)
  private async simulateTraining(modelId: string): Promise<void> {
    // Simulate training progress over time
    const steps = [10, 25, 50, 75, 90, 100];
    const delays = [1000, 2000, 3000, 2000, 1000, 500];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delays[i]));

      const status = steps[i] === 100 ? 'completed' : 'training';
      await this.updateProgress(modelId, steps[i], status);
    }

    // Generate a mock embedding
    const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);

    await this.updateEmbedding(modelId, embedding, {
      accuracy: 0.89,
      loss: 0.123,
      epochs: 42,
      datasetSize: 150,
    });
  }
}
