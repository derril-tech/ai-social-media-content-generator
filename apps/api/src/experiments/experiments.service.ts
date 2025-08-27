import { Injectable } from '@nestjs/common';

@Injectable()
export class ExperimentsService {
  async createExperiment(body: any) {
    return { id: 'exp_1', ...body, status: 'active' };
  }

  async listExperiments() {
    return [{ id: 'exp_1', name: 'A/B Test', status: 'active' }];
  }
}


