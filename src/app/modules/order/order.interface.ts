export type IOrderItem = {
  productId: string;
  quantity: number;
};

export type IOrderRequest = {
  userId: number;
  customerName: string;
  items: IOrderItem[];
};
