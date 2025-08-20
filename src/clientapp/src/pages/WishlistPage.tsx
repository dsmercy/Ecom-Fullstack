import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/configureStore';
import { 
  fetchWishlistItems, 
  removeFromWishlist, 
  clearWishlist 
} from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Star,
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const WishlistPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    items, 
    itemCount, 
    loading, 
    removeLoading, 
    clearLoading 
  } = useAppSelector(state => state.wishlist);
  const { addLoading } = useAppSelector(state => state.cart);

  useEffect(() => {
    dispatch(fetchWishlistItems());
  }, [dispatch]);

  const handleRemoveItem = async (productId: string) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      try {
        await dispatch(clearWishlist()).unwrap();
      } catch (error) {
        console.error('Failed to clear wishlist:', error);
      }
    }
  };

  const calculateSavings = (product: any) => {
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      return product.compareAtPrice - product.price;
    }
    return 0;
  };

  const totalValue = items.reduce((sum, item) => sum + item.product.price, 0);
  const totalSavings = items.reduce((sum, item) => sum + calculateSavings(item.product), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              to="/products" 
              className="text-blue-600 hover:text-blue-700 flex items-center mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Continue Shopping
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
            
            {items.length > 0 && (
              <div className="mt-4 sm:mt-0 flex space-x-4">
                <button
                  onClick={handleClearWishlist}
                  disabled={clearLoading}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {clearLoading ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Save items you love for later by clicking the heart icon on products you're interested in.
            </p>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{itemCount}</div>
                  <div className="text-gray-600">Items Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</div>
                  <div className="text-gray-600">Total Value</div>
                </div>
                {totalSavings > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</div>
                    <div className="text-gray-600">Potential Savings</div>
                  </div>
                )}
              </div>
            </div>

            {/* Wishlist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                const savings = calculateSavings(item.product);
                const discountPercentage = item.product.compareAtPrice 
                  ? Math.round(((item.product.compareAtPrice - item.product.price) / item.product.compareAtPrice) * 100)
                  : 0;

                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative">
                      <Link to={`/products/${item.product.id}`}>
                        <img
                          src={item.product.images[0]?.url || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      
                      {/* Discount Badge */}
                      {discountPercentage > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {discountPercentage}% OFF
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        disabled={removeLoading}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      </button>
                    </div>

                    <div className="p-4">
                      <Link to={`/products/${item.product.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      
                      {/* Rating */}
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(item.product.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          ({item.product.reviewCount})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${item.product.price.toFixed(2)}
                          </span>
                          {item.product.compareAtPrice && item.product.compareAtPrice > item.product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${item.product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {savings > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            Save ${savings.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Stock Status */}
                      <div className="mb-4">
                        {item.product.stockQuantity > 0 ? (
                          <span className="text-sm text-green-600">
                            {item.product.stockQuantity > 10 
                              ? 'In Stock' 
                              : `Only ${item.product.stockQuantity} left`
                            }
                          </span>
                        ) : (
                          <span className="text-sm text-red-600">Out of Stock</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(item.product.id)}
                          disabled={addLoading || item.product.stockQuantity === 0}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {item.product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          disabled={removeLoading}
                          className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </button>
                      </div>

                      {/* Date Added */}
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk Actions */}
            {items.length > 1 && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => {
                      items.forEach(item => {
                        if (item.product.stockQuantity > 0) {
                          handleAddToCart(item.product.id);
                        }
                      });
                    }}
                    disabled={addLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add All Available to Cart
                  </button>
                  
                  <button
                    onClick={handleClearWishlist}
                    disabled={clearLoading}
                    className="border border-red-300 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Clear Wishlist
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;