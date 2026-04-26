import { Controller } from '@nestjs/common';
import { AiPreviewService } from './ai-preview.service';

@Controller('ai-preview')
export class AiPreviewController {
  constructor(private readonly aiPreviewService: AiPreviewService) {}
}
