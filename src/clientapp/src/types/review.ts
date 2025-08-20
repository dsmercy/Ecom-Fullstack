import { User } from "./auth";
import { Product } from "./product";

export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewState {
  productReviews: Record<string, Review[]>;
  productReviewsLoading: Record<string, boolean>;
  productReviewsError: Record<string, string>;
  allReviews: Review[];
  allReviewsLoading: boolean;
  allReviewsError: string | null;
  userReviews: Review[];
  userReviewsLoading: boolean;
  userReviewsError: string | null;
  createLoading: boolean;
  approveLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  isReviewFormOpen: boolean;
  selectedProductForReview: Product | null;
}