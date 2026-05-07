/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PipeTransform } from '@nestjs/common';

export class CleanInputPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value !== 'object' || value === null) return value;

    return Object.fromEntries(
      Object.entries(value)
        .map(([k, v]) => {
          if (typeof v === 'string') {
            v = v.trim();
            if (v === '') {
              v = undefined;
            }
          }
          return [k, v];
        })
        .filter(([, v]) => v !== null && v !== undefined),
    );
  }
}
