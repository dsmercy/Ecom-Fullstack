import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/configureStore';
import { fetchOrders, cancelOrder } from '../store/slices/orderSlice';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Calendar,
  CreditCard
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { 
    orders, 
    loading, 
    cancelLoading 
  } = useAppSelector(state => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
      case 'returned':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status.toLowerCase());
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await dispatch(cancelOrder(orderId)).unwrap();
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === selectedStatus.toLowerCase());

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status.toLowerCase() === 'pending').length,
    confirmed: orders.filter(o => o.status.toLowerCase() === 'confirmed').length,
    processing: orders.filter(o => o.status.toLowerCase() === 'processing').length,
    shipped: orders.filter(o => o.status.toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
    cancelled: orders.filter(o => o.status.toLowerCase() === 'cancelled').length,
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'processing', label: 'Processing' },
                { key: 'shipped', label: 'Shipped' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`${
                    selectedStatus === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                  {statusCounts[tab.key as keyof typeof statusCounts] > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      selectedStatus === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {statusCounts[tab.key as keyof typeof statusCounts]}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === 'all' 
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `You don't have any ${selectedStatus} orders at the moment.`
              }
            </p>
            {selectedStatus === 'all' && (
              <Link
                to="/products"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm">
                            <CreditCard className={`h-4 w-4 mr-1 ${getPaymentStatusColor(order.paymentStatus)}`} />
                            <span className={getPaymentStatusColor(order.paymentStatus)}>
                              Payment {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={item.productImage || '/placeholder-image.jpg'}
                          alt={item.productName}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    {order.items.length > 3 && (
                      <div className="text-sm text-gray-600 text-center py-2">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex space-x-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                      
                      {order.trackingNumber && (
                        <a
                          href={`/track/${order.trackingNumber}`}
                          className="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Track Package
                        </a>
                      )}
                    </div>

                    <div className="flex space-x-4 mt-4 sm:mt-0">
                      {canCancelOrder(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancelLoading}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      
                      {order.status.toLowerCase() === 'delivered' && (
                        <div className="flex space-x-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Reorder
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            Leave Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for No Orders */}
        {orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link
              to="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Package className="mr-2 h-5 w-5" />
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;