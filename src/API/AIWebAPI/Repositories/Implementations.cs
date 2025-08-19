using AIWebAPI.Data;
using AIWebAPI.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace AIWebAPI.Repositories
{
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly EcommerceDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(EcommerceDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        public virtual async Task<IQueryable<T>> GetAllAsync()
        {
            return await Task.FromResult(_dbSet.AsQueryable());
        }

        public virtual async Task<T> AddAsync(T entity)
        {
            _dbSet.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<T> UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public virtual async Task DeleteAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public virtual async Task<bool> ExistsAsync(int id)
        {
            return await _dbSet.FindAsync(id) != null;
        }
    }

    public class UserRepository : IUserRepository
    {
        private readonly EcommerceDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserRepository(EcommerceDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<ApplicationUser?> GetByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }

        public async Task<ApplicationUser?> GetByEmailAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email);
        }

        public async Task<List<ApplicationUser>> GetUsersByRoleAsync(string role)
        {
            return (await _userManager.GetUsersInRoleAsync(role)).ToList();
        }
    }

    public class ProductRepository : BaseRepository<Product>, IProductRepository
    {
        public ProductRepository(EcommerceDbContext context) : base(context) { }

        public async Task<PaginatedResult<Product>> SearchProductsAsync(ProductSearchDto searchDto)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductTags)
                .ThenInclude(pt => pt.Tag)
                .Where(p => p.IsActive);

            // Search filter
            if (!string.IsNullOrEmpty(searchDto.Search))
            {
                query = query.Where(p => p.Name.Contains(searchDto.Search) ||
                                        p.Description.Contains(searchDto.Search));
            }

            // Category filter
            if (searchDto.CategoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == searchDto.CategoryId);
            }

            // Price filters
            if (searchDto.MinPrice.HasValue)
            {
                query = query.Where(p => p.Price >= searchDto.MinPrice);
            }

            if (searchDto.MaxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= searchDto.MaxPrice);
            }

            // Rating filter
            if (searchDto.MinRating.HasValue)
            {
                query = query.Where(p => p.AverageRating >= searchDto.MinRating);
            }

            // Tag filter
            if (searchDto.TagIds?.Any() == true)
            {
                query = query.Where(p => p.ProductTags.Any(pt => searchDto.TagIds.Contains(pt.TagId)));
            }

            // Sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "price" => searchDto.SortOrder?.ToLower() == "desc" ?
                    query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                "rating" => searchDto.SortOrder?.ToLower() == "desc" ?
                    query.OrderByDescending(p => p.AverageRating) : query.OrderBy(p => p.AverageRating),
                "created" => searchDto.SortOrder?.ToLower() == "desc" ?
                    query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                _ => searchDto.SortOrder?.ToLower() == "desc" ?
                    query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name)
            };

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            return new PaginatedResult<Product>
            {
                Items = items,
                TotalCount = totalCount,
                Page = searchDto.Page,
                PageSize = searchDto.PageSize
            };
        }

        public async Task<List<Product>> GetProductsByCategoryAsync(int categoryId)
        {
            return await _context.Products
                .Where(p => p.CategoryId == categoryId && p.IsActive)
                .Include(p => p.Category)
                .ToListAsync();
        }

        public async Task<Product?> GetProductBySkuAsync(string sku)
        {
            return await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.SKU == sku);
        }

        public async Task UpdateStockAsync(int productId, int quantity)
        {
            var product = await GetByIdAsync(productId);
            if (product != null)
            {
                product.StockQuantity = quantity;
                await UpdateAsync(product);
            }
        }
    }

    public class CategoryRepository : BaseRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(EcommerceDbContext context) : base(context) { }

        public async Task<List<Category>> GetCategoriesWithSubCategoriesAsync()
        {
            return await _context.Categories
                .Include(c => c.SubCategories)
                .Where(c => c.ParentCategoryId == null)
                .ToListAsync();
        }

        public async Task<List<Category>> GetSubCategoriesAsync(int parentCategoryId)
        {
            return await _context.Categories
                .Where(c => c.ParentCategoryId == parentCategoryId)
                .ToListAsync();
        }
    }

    public class CartRepository : ICartRepository
    {
        private readonly EcommerceDbContext _context;

        public CartRepository(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<List<CartItem>> GetCartItemsAsync(string userId)
        {
            return await _context.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.UserId == userId)
                .ToListAsync();
        }

        public async Task<CartItem?> GetCartItemAsync(string userId, int productId)
        {
            return await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.UserId == userId && ci.ProductId == productId);
        }

        public async Task<CartItem> AddToCartAsync(string userId, int productId, int quantity)
        {
            var existingItem = await GetCartItemAsync(userId, productId);

            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
                await _context.SaveChangesAsync();
                return existingItem;
            }

            var cartItem = new CartItem
            {
                UserId = userId,
                ProductId = productId,
                Quantity = quantity
            };

            _context.CartItems.Add(cartItem);
            await _context.SaveChangesAsync();
            return cartItem;
        }

        public async Task UpdateCartItemAsync(int cartItemId, int quantity)
        {
            var cartItem = await _context.CartItems.FindAsync(cartItemId);
            if (cartItem != null)
            {
                cartItem.Quantity = quantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveFromCartAsync(int cartItemId)
        {
            var cartItem = await _context.CartItems.FindAsync(cartItemId);
            if (cartItem != null)
            {
                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearCartAsync(string userId)
        {
            var cartItems = await _context.CartItems
                .Where(ci => ci.UserId == userId)
                .ToListAsync();

            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();
        }
    }

    public class OrderRepository : BaseRepository<Order>, IOrderRepository
    {
        public OrderRepository(EcommerceDbContext context) : base(context) { }

        public async Task<List<Order>> GetUserOrdersAsync(string userId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderWithItemsAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }

        public async Task<string> GenerateOrderNumberAsync()
        {
            var lastOrder = await _context.Orders
                .OrderByDescending(o => o.Id)
                .FirstOrDefaultAsync();

            var nextNumber = lastOrder?.Id + 1 ?? 1;
            return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{nextNumber:D6}";
        }
    }

    public class ReviewRepository : BaseRepository<Review>, IReviewRepository
    {
        public ReviewRepository(EcommerceDbContext context) : base(context) { }

        public async Task<List<Review>> GetProductReviewsAsync(int productId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.ProductId == productId && r.IsApproved)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<bool> UserHasReviewedProductAsync(string userId, int productId)
        {
            return await _context.Reviews
                .AnyAsync(r => r.UserId == userId && r.ProductId == productId);
        }

        public async Task<double> GetProductAverageRatingAsync(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId && r.IsApproved)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }
    }

    public class WishlistRepository : IWishlistRepository
    {
        private readonly EcommerceDbContext _context;

        public WishlistRepository(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<List<WishlistItem>> GetWishlistItemsAsync(string userId)
        {
            return await _context.WishlistItems
                .Include(wi => wi.Product)
                .Where(wi => wi.UserId == userId)
                .ToListAsync();
        }

        public async Task<WishlistItem> AddToWishlistAsync(string userId, int productId)
        {
            var wishlistItem = new WishlistItem
            {
                UserId = userId,
                ProductId = productId
            };

            _context.WishlistItems.Add(wishlistItem);
            await _context.SaveChangesAsync();
            return wishlistItem;
        }

        public async Task RemoveFromWishlistAsync(string userId, int productId)
        {
            var wishlistItem = await _context.WishlistItems
                .FirstOrDefaultAsync(wi => wi.UserId == userId && wi.ProductId == productId);

            if (wishlistItem != null)
            {
                _context.WishlistItems.Remove(wishlistItem);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsInWishlistAsync(string userId, int productId)
        {
            return await _context.WishlistItems
                .AnyAsync(wi => wi.UserId == userId && wi.ProductId == productId);
        }
    }

    public class InventoryRepository : IInventoryRepository
    {
        private readonly EcommerceDbContext _context;

        public InventoryRepository(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetStockQuantityAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            return product?.StockQuantity ?? 0;
        }

        public async Task<bool> ReserveStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null && product.StockQuantity >= quantity)
            {
                product.StockQuantity -= quantity;
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public async Task ReleaseStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null)
            {
                product.StockQuantity += quantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Product>> GetLowStockProductsAsync(int threshold = 10)
        {
            return await _context.Products
                .Where(p => p.StockQuantity <= threshold && p.IsActive)
                .ToListAsync();
        }
    }

    public class PromotionRepository : BaseRepository<Promotion>, IPromotionRepository
    {
        public PromotionRepository(EcommerceDbContext context) : base(context) { }

        public async Task<Promotion?> GetPromotionByCodeAsync(string code)
        {
            return await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code == code && p.IsActive &&
                                        p.StartDate <= DateTime.UtcNow &&
                                        p.EndDate >= DateTime.UtcNow);
        }

        public async Task<List<Promotion>> GetActivePromotionsAsync()
        {
            return await _context.Promotions
                .Where(p => p.IsActive &&
                           p.StartDate <= DateTime.UtcNow &&
                           p.EndDate >= DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task IncrementUsageCountAsync(int promotionId)
        {
            var promotion = await GetByIdAsync(promotionId);
            if (promotion != null)
            {
                promotion.UsageCount++;
                await UpdateAsync(promotion);
            }
        }
    }
}
