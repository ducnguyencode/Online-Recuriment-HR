/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pdfParse from 'pdf-parse';
import { AiResponseDto } from 'src/dto/ai.response.dto';
import axios from 'axios';
import { Application } from 'src/entities/application.entity';
@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY_OANHVU')!,
    );
  }

  async generateWithRetry(fn: () => Promise<any>, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (err?.status === 503 && i < retries - 1) {
          await new Promise((res) => setTimeout(res, 1000 * (i + 1))); // backoff
          continue;
        }
        throw err;
      }
    }
  }

  async reviewCv(application: Application): Promise<AiResponseDto | null> {
    const fileUrl = `${this.configService.get('BASE_URL')}/uploads/${application.cv?.fileUrl}`;
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    const pdfBuffer = Buffer.from(response.data);

    if (pdfBuffer) {
      // 1. Extract text
      const { text: pdfText } = (await pdfParse(pdfBuffer)) as {
        text: string;
      };
      // 2. Call gemini
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
      });

      const prompt = `
        Extract cv data into JSON
        Then compare with application to see how % that cv match application's vacancy.
        Remember to check correct info of applicant and cv, if not match no need to compare. Give 0% score and said it right in sumaryAnalysis
        No explaination.
        
        Format:
        {
            "cvData": {
                "name": "",
                "skills": ["skillName",...];
                "education": "";
                "experience":"x years"
            },
            "matchScore": number (example 70% show 70),
            "sumaryAnalysis": ""
        }

        Application:
        ${JSON.stringify(application)}

        CV text:
        ${pdfText}
        `;

      const result = await this.generateWithRetry(() =>
        model.generateContent(prompt),
      );
      const response = await result.response;
      const text = response.text();

      // 3. Clean + parse JSON
      const clean = text.replace(/```json|```/g, '').trim();
      const finalData = JSON.parse(clean);

      return finalData as AiResponseDto;
    }
    return null;
  }
}
