import { Product } from "./product";

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  addLoading: boolean;
  removeLoading: boolean;
  clearLoading: boolean;
  checkLoading: boolean;
  error: string | null;
  checkedProducts: Record<string, boolean>;
}
