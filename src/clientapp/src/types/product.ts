import { FilterParams, SortParams } from "./api";
import { User } from "./auth";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  sellerId: string;
  seller?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  parentCategory?: Category;
  subcategories?: Category[];
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters extends FilterParams, SortParams {
  inStock?: boolean;
  featured?: boolean;
}

export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  featuredProducts: Product[];
  relatedProducts: Product[];
  searchResults: Product[];
  categoryProducts: Product[];
  loading: boolean;
  searchLoading: boolean;
  featuredLoading: boolean;
  relatedLoading: boolean;
  categoryLoading: boolean;
  currentProductLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
  searchError: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  filters: ProductFilters;
}