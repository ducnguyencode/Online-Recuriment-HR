/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiResponseDto } from 'src/dto/ai.response.dto';
import axios from 'axios';
import { Application } from 'src/entities/application.entity';
const pdfParse = require('pdf-parse');
@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY_OANHVU')!,
    );
  }

  async reviewCv(
    fileName: string,
    application: Application,
  ): Promise<AiResponseDto | null> {
    const fileUrl = `${this.configService.get('BASE_URL')}/uploads/cv/${fileName}`;
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
        model: 'gemini-3.1-flash-lite-preview',
      });

      const prompt = `
        Extract cv data into JSON
        Then compare with application to see how % that cv match application's vacancy.
        No explaination.
        
        Format:
        {
            "cvData": {
                "name": "",
                "skills": [{"skillName":"","skillExp":""},...];
                "positionFavor": "";
            },
            "matchScore": "",
            "sumaryAnalysis": ""
        }

        Application:
        ${JSON.stringify(application)}

        CV text:
        ${pdfText}
        `;

      const result = await model.generateContent(prompt);
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
