import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/configureStore';
import { 
  fetchCartItems, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../store/slices/cartSlice';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    items, 
    total, 
    itemCount, 
    loading, 
    updateLoading, 
    removeLoading, 
    clearLoading 
  } = useAppSelector(state => state.cart);

  useEffect(() => {
    dispatch(fetchCartItems());
  }, [dispatch]);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    
    try {
      await dispatch(updateCartItem({ cartItemId, quantity: newQuantity })).unwrap();
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await dispatch(removeFromCart(cartItemId)).unwrap();
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await dispatch(clearCart()).unwrap();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  const calculateSavings = (item: typeof items[0]) => {
    if (item.product.compareAtPrice && item.product.compareAtPrice > item.price) {
      return (item.product.compareAtPrice - item.price) * item.quantity;
    }
    return 0;
  };

  const totalSavings = items.reduce((sum, item) => sum + calculateSavings(item), 0);
  const estimatedTax = total * 0.08; // 8% tax rate
  const shipping = total > 50 ? 0 : 5.99; // Free shipping over $50
  const finalTotal = total + estimatedTax + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Start Shopping
            </Link>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Cart Items */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-md">
              {/* Cart Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart Items ({itemCount})
                </h2>
                {items.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    disabled={clearLoading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {clearLoading ? 'Clearing...' : 'Clear Cart'}
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images[0]?.url || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/products/${item.product.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-lg font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.product.compareAtPrice && item.product.compareAtPrice > item.price && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ${item.product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                          {calculateSavings(item) > 0 && (
                            <span className="text-sm text-green-600 ml-2">
                              Save ${calculateSavings(item).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Stock Status */}
                        {item.product.stockQuantity < 5 && item.product.stockQuantity > 0 && (
                          <p className="text-sm text-orange-600 mt-1">
                            Only {item.product.stockQuantity} left in stock
                          </p>
                        )}
                        {item.product.stockQuantity === 0 && (
                          <p className="text-sm text-red-600 mt-1">Out of stock</p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updateLoading || item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updateLoading || item.quantity >= item.product.stockQuantity}
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${item.total.toFixed(2)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeLoading}
                          className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Savings</span>
                    <span>-${totalSavings.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Tax</span>
                  <span className="font-medium">${estimatedTax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                {shipping > 0 && (
                  <div className="text-sm text-gray-500">
                    Add ${(50 - total).toFixed(2)} more for free shipping
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-6 block text-center font-medium"
              >
                Proceed to Checkout
              </Link>

              {/* Continue Shopping */}
              <Link
                to="/products"
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors mt-3 block text-center font-medium"
              >
                Continue Shopping
              </Link>

              {/* Security Badge */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;