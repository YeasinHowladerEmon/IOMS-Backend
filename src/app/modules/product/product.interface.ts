export type IProduct = {
  name: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  minStockThreshold?: number;
};
