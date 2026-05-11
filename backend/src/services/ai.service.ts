import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pdfParse from 'pdf-parse';
import { AiPreviewStatus, AiResponseDto } from 'src/dto/ai.response.dto';
import axios from 'axios';
import { Application } from 'src/entities/application.entity';

const AI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    cvData: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        education: { type: SchemaType.STRING },
        experience: { type: SchemaType.STRING },
      },
      required: ['name', 'skills', 'education', 'experience'],
    },
    matchScore: { type: SchemaType.NUMBER },
    sumaryAnalysis: { type: SchemaType.STRING },
  },
  required: ['cvData', 'matchScore', 'sumaryAnalysis'],
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API')!,
    );
  }

  async generateWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'status' in err
            ? (err as { status?: number }).status
            : undefined;
        if (status === 503 && i < retries - 1) {
          await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Retry attempts exhausted');
  }

  async reviewCv(application: Application): Promise<AiResponseDto | null> {
    const cvFileUrl = application.submittedCvFileUrl ?? application.cv?.fileUrl;
    if (!cvFileUrl) {
      return null;
    }

    const fileUrl = `${this.configService.get('BASE_URL')}/uploads/${cvFileUrl}`;
    const response = await axios.get<ArrayBuffer>(fileUrl, {
      responseType: 'arraybuffer',
    });
    const pdfBuffer = Buffer.from(response.data);

    const { text: pdfText } = (await pdfParse(pdfBuffer)) as { text: string };

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: AI_RESPONSE_SCHEMA as never,
      },
    });

    const vacancyContext = {
      title: application.vacancy?.title ?? '',
      description: application.vacancy?.description ?? '',
    };
    const applicantContext = {
      name: application.applicant?.user?.fullName ?? '',
      email: application.applicant?.user?.email ?? '',
    };

    const prompt = `
You are an ATS resume screener. Compare the CV text to the vacancy and return JSON only.

Rules:
- If the CV applicant name/email does not match the applicant on file, set matchScore = 0 and explain in sumaryAnalysis.
- matchScore is an integer 0..100 (e.g. 70 means 70%).
- sumaryAnalysis is a short (<= 60 word) English summary.

Vacancy:
${JSON.stringify(vacancyContext)}

Applicant on file:
${JSON.stringify(applicantContext)}

CV text:
${pdfText}
`;

    const result = await this.generateWithRetry(() =>
      model.generateContent(prompt),
    );
    const text = result.response.text();

    let parsed: Partial<AiResponseDto>;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as Partial<AiResponseDto>;
    } catch (err) {
      this.logger.warn(
        `AI response not valid JSON for application ${application.id}: ${text.slice(0, 200)}`,
      );
      return null;
    }

    if (
      typeof parsed?.matchScore !== 'number' ||
      Number.isNaN(parsed.matchScore)
    ) {
      this.logger.warn(
        `AI response missing matchScore for application ${application.id}`,
      );
      return null;
    }

    const clampedScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore)));

    return {
      cvData: parsed.cvData ?? ({} as AiResponseDto['cvData']),
      matchScore: clampedScore,
      sumaryAnalysis: parsed.sumaryAnalysis ?? '',
      status: AiPreviewStatus.COMPLETE,
    };
  }
}
