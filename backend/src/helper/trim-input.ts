/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform } from 'class-transformer';

export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
