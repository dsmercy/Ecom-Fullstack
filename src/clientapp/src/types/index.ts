import { AdminState } from "./admin";
import { AuthState } from "./auth";
import { CartState } from "./cart";
import { NotificationState } from "./notification";
import { OrderState } from "./order";
import { ProductState, Category } from "./product";
import { ReviewState } from "./review";
import { WishlistState } from "./wishlist";


// Redux types
export interface RootState {
  auth: AuthState;
  products: ProductState;
  cart: CartState;
  orders: OrderState;
  categories: CategoryState;
  wishlist: WishlistState;
  reviews: ReviewState;
  notifications: NotificationState;
  admin: AdminState;
}

export interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  subcategories: Category[];
  loading: boolean;
  categoryLoading: boolean;
  subcategoryLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
}