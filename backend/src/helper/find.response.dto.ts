export class FindResponseDto<T> {
  items!: T[];
  totalPage!: number;
  totalItems!: number;
}
