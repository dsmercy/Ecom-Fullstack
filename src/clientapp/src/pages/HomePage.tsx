import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/configureStore';
import { fetchFeaturedProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { ArrowRight, Star, ShoppingCart, Heart, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    featuredProducts, 
    featuredLoading 
  } = useAppSelector(state => state.products);
  const { 
    categories, 
    loading: categoriesLoading 
  } = useAppSelector(state => state.categories);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const mainCategories = categories.filter(cat => !cat.parentCategoryId).slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to EcomStore
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover amazing products at unbeatable prices
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/products?featured=true"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our wide selection of products across different categories
            </p>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {mainCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-16 h-16 mx-auto mb-4 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-gray-600">
                Handpicked products just for you
              </p>
            </div>
            <Link
              to="/products?featured=true"
              className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={product.images[0]?.url || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 space-y-2">
                        <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                          <Heart className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          ({product.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10k+</div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50k+</div>
              <div className="text-gray-300">Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">99%</div>
              <div className="text-gray-300">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, exclusive deals, and special offers.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;