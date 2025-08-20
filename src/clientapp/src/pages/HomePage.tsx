import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EcomStore
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your one-stop destination for quality products
          </p>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-700">
              This is the homepage of your TypeScript e-commerce application.
              The complete application structure is now set up with proper TypeScript support,
              Redux state management, and modern React patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;