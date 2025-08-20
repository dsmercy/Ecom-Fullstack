import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/configureStore';
import { fetchProduct, fetchRelatedProducts } from '../store/slices/productSlice';
import { fetchProductReviews } from '../store/slices/reviewSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  ArrowLeft, 
  Plus, 
  Minus,
  Check,
  Truck,
  Shield,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { 
    currentProduct: product, 
    currentProductLoading: loading,
    relatedProducts,
    relatedLoading
  } = useAppSelector(state => state.products);
  
  const { productReviews } = useAppSelector(state => state.reviews);
  const { addLoading } = useAppSelector(state => state.cart);
  const { checkedProducts } = useAppSelector(state => state.wishlist);
  const { isAuthenticated } = useAppSelector(state => state.auth);

  const reviews = id ? productReviews[id] || [] : [];
  const isInWishlist = id ? checkedProducts[id] : false;

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
      dispatch(fetchProductReviews({ productId: id }));
      dispatch(fetchRelatedProducts(id));
    }
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !product) return;
    try {
      await dispatch(addToCart({ productId: product.id, quantity })).unwrap();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !product) return;
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product.id)).unwrap();
      } else {
        await dispatch(addToWishlist(product.id)).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const calculateDiscount = () => {
    if (product?.compareAtPrice && product.compareAtPrice > product.price) {
      return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link to="/products" className="text-blue-600 hover:text-blue-700">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-8">
          <Link 
            to="/products" 
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Products
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Product Images */}
          <div className="mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Main Image */}
              <div className="aspect-w-1 aspect-h-1 relative">
                <img
                  src={product.images[selectedImageIndex]?.url || '/placeholder-image.jpg'}
                  alt={product.images[selectedImageIndex]?.altText || product.name}
                  className="w-full h-96 object-cover"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {discount}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || product.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:pl-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      Save {discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stockQuantity > 0 ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span>
                      {product.stockQuantity > 10 
                        ? 'In Stock' 
                        : `Only ${product.stockQuantity} left in stock`
                      }
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stockQuantity > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg w-32">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300 text-center flex-1">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4 mb-8">
                {isAuthenticated && (
                  <>
                    <button
                      onClick={handleAddToCart}
                      disabled={addLoading || product.stockQuantity === 0}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {addLoading ? 'Adding...' : 'Add to Cart'}
                    </button>

                    <button
                      onClick={handleToggleWishlist}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Heart 
                        className={`mr-2 h-5 w-5 ${
                          isInWishlist ? 'text-red-500 fill-current' : ''
                        }`} 
                      />
                      {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                  </>
                )}
              </div>

              {/* Features */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm text-gray-700">Free shipping on orders over $50</span>
                  </div>
                  <div className="flex items-center">
                    <RefreshCw className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">30-day return policy</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm text-gray-700">2-year warranty included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Customer Reviews ({product.reviewCount})
            </h2>
            
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 font-medium text-gray-900">
                          {review.user?.firstName} {review.user?.lastName}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
                
                {reviews.length > 5 && (
                  <div className="text-center">
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      View all {product.reviewCount} reviews
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
            </div>
            
            {relatedLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    to={`/products/${relatedProduct.id}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={relatedProduct.images[0]?.url || '/placeholder-image.jpg'}
                        alt={relatedProduct.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {relatedProduct.name}
                        </h3>
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(relatedProduct.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 ml-1">
                            ({relatedProduct.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ${relatedProduct.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;