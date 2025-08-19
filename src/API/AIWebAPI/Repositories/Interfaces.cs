using AIWebAPI.DTOs;

namespace AIWebAPI.Repositories
{
    public interface IBaseRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id);
        Task<IQueryable<T>> GetAllAsync();
        Task<T> AddAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
    }

    public interface IUserRepository
    {
        Task<ApplicationUser?> GetByIdAsync(string id);
        Task<ApplicationUser?> GetByEmailAsync(string email);
        Task<List<ApplicationUser>> GetUsersByRoleAsync(string role);
    }

    public interface IProductRepository : IBaseRepository<Product>
    {
        Task<PaginatedResult<Product>> SearchProductsAsync(ProductSearchDto searchDto);
        Task<List<Product>> GetProductsByCategoryAsync(int categoryId);
        Task<Product?> GetProductBySkuAsync(string sku);
        Task UpdateStockAsync(int productId, int quantity);
    }

    public interface ICategoryRepository : IBaseRepository<Category>
    {
        Task<List<Category>> GetCategoriesWithSubCategoriesAsync();
        Task<List<Category>> GetSubCategoriesAsync(int parentCategoryId);
    }

    public interface ICartRepository
    {
        Task<List<CartItem>> GetCartItemsAsync(string userId);
        Task<CartItem?> GetCartItemAsync(string userId, int productId);
        Task<CartItem> AddToCartAsync(string userId, int productId, int quantity);
        Task UpdateCartItemAsync(int cartItemId, int quantity);
        Task RemoveFromCartAsync(int cartItemId);
        Task ClearCartAsync(string userId);
    }

    public interface IOrderRepository : IBaseRepository<Order>
    {
        Task<List<Order>> GetUserOrdersAsync(string userId);
        Task<Order?> GetOrderWithItemsAsync(int orderId);
        Task<string> GenerateOrderNumberAsync();
    }

    public interface IReviewRepository : IBaseRepository<Review>
    {
        Task<List<Review>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10);
        Task<bool> UserHasReviewedProductAsync(string userId, int productId);
        Task<double> GetProductAverageRatingAsync(int productId);
    }

    public interface IWishlistRepository
    {
        Task<List<WishlistItem>> GetWishlistItemsAsync(string userId);
        Task<WishlistItem> AddToWishlistAsync(string userId, int productId);
        Task RemoveFromWishlistAsync(string userId, int productId);
        Task<bool> IsInWishlistAsync(string userId, int productId);
    }

    public interface IInventoryRepository
    {
        Task<int> GetStockQuantityAsync(int productId);
        Task<bool> ReserveStockAsync(int productId, int quantity);
        Task ReleaseStockAsync(int productId, int quantity);
        Task<List<Product>> GetLowStockProductsAsync(int threshold = 10);
    }

    public interface IPromotionRepository : IBaseRepository<Promotion>
    {
        Task<Promotion?> GetPromotionByCodeAsync(string code);
        Task<List<Promotion>> GetActivePromotionsAsync();
        Task IncrementUsageCountAsync(int promotionId);
    }
}
