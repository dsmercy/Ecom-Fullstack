using AIWebAPI.Data;
using AIWebAPI.DTOs;
using AIWebAPI.Repositories;
using AIWebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AIWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseApiController
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                return CreatedResponse(result, "/api/auth/login", "User registered successfully");
            }
            catch (ArgumentException ex)
            {
                return ApiError(ex.Message, errors: new List<string> { ex.Message });
            }
        }

        [HttpPost("register/seller")]
        public async Task<IActionResult> RegisterSeller([FromBody] RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto, "Seller");
                return CreatedResponse(result, "/api/auth/login", "Seller registered successfully");
            }
            catch (ArgumentException ex)
            {
                return ApiError(ex.Message, errors: new List<string> { ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
                return ApiError("Invalid credentials", 401);

            return ApiResponse(result, "Login successful");
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _authService.LogoutAsync(userId!);
            return ApiResponse(true, "Logged out successfully");
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _authService.ChangePasswordAsync(userId!, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

            if (result)
                return ApiResponse(true, "Password changed successfully");

            return ApiError("Failed to change password");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : BaseApiController
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        public async Task<IActionResult> SearchProducts([FromQuery] ProductSearchDto searchDto)
        {
            var result = await _productService.SearchProductsAsync(searchDto);
            return ApiResponse(result, "Products fetched successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFoundResponse("Product not found");

            return ApiResponse(product, "Product fetched successfully");
        }

        [HttpPost]
        [Authorize(Policy = "AdminOrSeller")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto createProductDto)
        {
            var product = await _productService.CreateProductAsync(createProductDto);
            return CreatedResponse(product, $"/api/products/{product.Id}", "Product created successfully");
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOrSeller")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductDto updateProductDto)
        {
            var product = await _productService.UpdateProductAsync(id, updateProductDto);
            if (product == null)
                return NotFoundResponse("Product not found");

            return ApiResponse(product, "Product updated successfully");
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOrSeller")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var result = await _productService.DeleteProductAsync(id);
            if (!result)
                return NotFoundResponse("Product not found");

            return ApiResponse(true, "Product deleted successfully");
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            var products = await _productService.GetFeaturedProductsAsync();
            return ApiResponse(products, "Featured products fetched successfully");
        }

        [HttpGet("{id}/related")]
        public async Task<IActionResult> GetRelatedProducts(int id)
        {
            var products = await _productService.GetRelatedProductsAsync(id);
            return ApiResponse(products, "Related products fetched successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : BaseApiController
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCartItems()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cartItems = await _cartService.GetCartItemsAsync(userId!);
            return ApiResponse(cartItems, "Cart items fetched successfully");
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto addToCartDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var cartItem = await _cartService.AddToCartAsync(userId!, addToCartDto);
                return ApiResponse(cartItem, "Item added to cart successfully");
            }
            catch (InvalidOperationException ex)
            {
                return ApiError(ex.Message);
            }
        }

        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateCartItem(int cartItemId, [FromBody] UpdateCartItemDto updateDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _cartService.UpdateCartItemAsync(userId!, cartItemId, updateDto.Quantity);

            if (!result)
                return ApiError("Unable to update cart item");

            return ApiResponse(true, "Cart item updated successfully");
        }

        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _cartService.RemoveFromCartAsync(userId!, cartItemId);

            if (!result)
                return NotFoundResponse("Cart item not found");

            return ApiResponse(true, "Cart item removed successfully");
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _cartService.ClearCartAsync(userId!);
            return ApiResponse(true, "Cart cleared successfully");
        }

        [HttpGet("total")]
        public async Task<IActionResult> GetCartTotal()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var total = await _cartService.GetCartTotalAsync(userId!);
            return ApiResponse(total, "Cart total fetched successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : BaseApiController
    {
        private readonly IOrderService _orderService;
        private readonly IPaymentService _paymentService;

        public OrdersController(IOrderService orderService, IPaymentService paymentService)
        {
            _orderService = orderService;
            _paymentService = paymentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var orders = await _orderService.GetUserOrdersAsync(userId!);
            return ApiResponse(orders, "Orders fetched successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var order = await _orderService.GetOrderByIdAsync(id, userId!);

            if (order == null)
                return NotFoundResponse("Order not found");

            return ApiResponse(order, "Order fetched successfully");
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto checkoutDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var order = await _orderService.CreateOrderAsync(userId!, checkoutDto);

                // Create payment intent
                var paymentIntentId = await _paymentService.CreatePaymentIntentAsync(order.Id);

                return ApiResponse(new { order, paymentIntentId }, "Order placed and payment intent created successfully");
            }
            catch (InvalidOperationException ex)
            {
                return ApiError(ex.Message);
            }
        }

        [HttpPost("{id}/payment")]
        public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentDto paymentDto)
        {
            var result = await _paymentService.ProcessPaymentAsync(id, paymentDto.PaymentIntentId);

            if (!result)
                return ApiError("Payment processing failed");

            return ApiResponse(true, "Payment processed successfully");
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _orderService.CancelOrderAsync(id, userId!);

            if (!result)
                return ApiError("Unable to cancel order");

            return ApiResponse(true, "Order cancelled successfully");
        }

        [HttpPut("{id}/status")]
        [Authorize(Policy = "AdminOrSeller")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto statusDto)
        {
            var result = await _orderService.UpdateOrderStatusAsync(id, statusDto.Status);

            if (!result)
                return NotFoundResponse("Order not found");

            return ApiResponse(true, "Order status updated successfully");
        }

        [HttpGet("admin/{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetOrderForAdmin(int id)
        {
            var order = await _orderService.GetOrderByIdForAdminAsync(id);

            if (order == null)
                return NotFoundResponse("Order not found");

            return ApiResponse(order, "Order fetched successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : BaseApiController
    {
        private readonly IReviewRepository _reviewRepository;

        public ReviewsController(IReviewRepository reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId, int page = 1, int pageSize = 10)
        {
            var reviews = await _reviewRepository.GetProductReviewsAsync(productId, page, pageSize);
            var reviewDtos = reviews.Select(r => new ReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Comment = r.Comment,
                UserName = r.User.FirstName + " " + r.User.LastName,
                CreatedAt = r.CreatedAt
            }).ToList();

            return ApiResponse(reviewDtos, "Product reviews fetched successfully");
        }

        [HttpPost]
        [Authorize(Policy = "CustomerOnly")]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto createReviewDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Check if user already reviewed this product
            var hasReviewed = await _reviewRepository.UserHasReviewedProductAsync(userId!, createReviewDto.ProductId);
            if (hasReviewed)
                return ApiError("You have already reviewed this product");

            var review = new Review
            {
                ProductId = createReviewDto.ProductId,
                UserId = userId!,
                Rating = createReviewDto.Rating,
                Comment = createReviewDto.Comment
            };

            var createdReview = await _reviewRepository.AddAsync(review);
            return CreatedResponse(createdReview, $"/api/reviews/product/{createReviewDto.ProductId}", "Review created successfully");
        }

        [HttpPut("{id}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            var review = await _reviewRepository.GetByIdAsync(id);
            if (review == null)
                return NotFoundResponse("Review not found");

            review.IsApproved = true;
            await _reviewRepository.UpdateAsync(review);

            return ApiResponse(true, "Review approved successfully");
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            var review = await _reviewRepository.GetByIdAsync(id);
            if (review == null)
                return NotFoundResponse("Review not found");

            if (review.UserId != userId && !isAdmin)
                return ApiError("You are not authorized to delete this review", 403);

            await _reviewRepository.DeleteAsync(id);
            return ApiResponse(true, "Review deleted successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistController : BaseApiController
    {
        private readonly IWishlistRepository _wishlistRepository;

        public WishlistController(IWishlistRepository wishlistRepository)
        {
            _wishlistRepository = wishlistRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlistItems()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var wishlistItems = await _wishlistRepository.GetWishlistItemsAsync(userId!);

            var wishlistDtos = wishlistItems.Select(wi => new WishlistItemDto
            {
                Id = wi.Id,
                ProductId = wi.ProductId,
                ProductName = wi.Product.Name,
                Price = wi.Product.SalePrice ?? wi.Product.Price,
                ImageUrl = wi.Product.ImageUrl,
                CreatedAt = wi.CreatedAt
            }).ToList();

            return ApiResponse(wishlistDtos, "Wishlist items fetched successfully");
        }

        [HttpPost("items/{productId}")]
        public async Task<IActionResult> AddToWishlist(int productId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var isAlreadyInWishlist = await _wishlistRepository.IsInWishlistAsync(userId!, productId);
            if (isAlreadyInWishlist)
                return ApiError("Product already in wishlist");

            var wishlistItem = await _wishlistRepository.AddToWishlistAsync(userId!, productId);
            return ApiResponse(wishlistItem, "Product added to wishlist successfully");
        }

        [HttpDelete("items/{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _wishlistRepository.RemoveFromWishlistAsync(userId!, productId);
            return ApiResponse(true, "Product removed from wishlist successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    public class AdminController : BaseApiController
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderService _orderService;
        private readonly IInventoryService _inventoryService;
        private readonly IPromotionService _promotionService;
        private readonly EcommerceDbContext _context;

        public AdminController(
            IUserRepository userRepository,
            IOrderService orderService,
            IInventoryService inventoryService,
            IPromotionService promotionService,
            EcommerceDbContext context)
        {
            _userRepository = userRepository;
            _orderService = orderService;
            _inventoryService = inventoryService;
            _promotionService = promotionService;
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();
            var totalRevenue = await _context.Orders
                .Where(o => o.PaymentStatus == PaymentStatus.Completed)
                .SumAsync(o => o.TotalAmount);
            var pendingOrders = await _context.Orders
                .CountAsync(o => o.Status == OrderStatus.Pending);

            var dashboard = new
            {
                totalUsers,
                totalOrders,
                totalRevenue,
                pendingOrders,
                lowStockProducts = await _inventoryService.GetLowStockProductsAsync()
            };

            return ApiResponse(dashboard, "Admin dashboard data fetched successfully");
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(int page = 1, int pageSize = 10)
        {
            var users = await _context.Users
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.PhoneNumber,
                    u.CreatedAt,
                    u.IsActive
                })
                .ToListAsync();

            var totalUsers = await _context.Users.CountAsync();

            return ApiResponse(new { users, totalUsers, page, pageSize }, "Users fetched successfully");
        }

        [HttpPut("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(string userId, [FromBody] UpdateUserStatusDto statusDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return NotFoundResponse("User not found");

            user.IsActive = statusDto.IsActive;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return ApiResponse(true, "User status updated successfully");
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders(int page = 1, int pageSize = 10)
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    o.OrderNumber,
                    o.Status,
                    o.TotalAmount,
                    o.CreatedAt,
                    UserName = o.User.FirstName + " " + o.User.LastName,
                    UserEmail = o.User.Email,
                    ItemCount = o.OrderItems.Count
                })
                .ToListAsync();

            var totalOrders = await _context.Orders.CountAsync();

            return ApiResponse(new { orders, totalOrders, page, pageSize }, "Orders fetched successfully");
        }

        [HttpPost("promotions")]
        public async Task<IActionResult> CreatePromotion([FromBody] CreatePromotionDto createPromotionDto)
        {
            var promotion = new Promotion
            {
                Name = createPromotionDto.Name,
                Code = createPromotionDto.Code,
                Type = createPromotionDto.Type,
                Value = createPromotionDto.Value,
                MinimumOrderAmount = createPromotionDto.MinimumOrderAmount,
                UsageLimit = createPromotionDto.UsageLimit,
                StartDate = createPromotionDto.StartDate,
                EndDate = createPromotionDto.EndDate
            };

            var createdPromotion = await _promotionService.CreatePromotionAsync(promotion);
            return CreatedResponse(createdPromotion, $"/api/admin/promotions/{createdPromotion.Id}", "Promotion created successfully");
        }

        [HttpGet("analytics/sales")]
        public async Task<IActionResult> GetSalesAnalytics([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Orders.Where(o => o.PaymentStatus == PaymentStatus.Completed);

            if (startDate.HasValue)
                query = query.Where(o => o.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(o => o.CreatedAt <= endDate.Value);

            var salesByDay = await query
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    TotalSales = g.Sum(o => o.TotalAmount),
                    OrderCount = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.PaymentStatus == PaymentStatus.Completed)
                .GroupBy(oi => new { oi.ProductId, oi.Product.Name })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalQuantity = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.TotalPrice)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            return ApiResponse(new { salesByDay, topProducts }, "Sales analytics fetched successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : BaseApiController
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoriesController(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoryRepository.GetCategoriesWithSubCategoriesAsync();
            return ApiResponse(categories, "Categories fetched successfully");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFoundResponse("Category not found");

            return ApiResponse(category, "Category fetched successfully");
        }

        [HttpGet("{id}/subcategories")]
        public async Task<IActionResult> GetSubCategories(int id)
        {
            var subcategories = await _categoryRepository.GetSubCategoriesAsync(id);
            return ApiResponse(subcategories, "Subcategories fetched successfully");
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto createCategoryDto)
        {
            var category = new Category
            {
                Name = createCategoryDto.Name,
                Description = createCategoryDto.Description,
                ParentCategoryId = createCategoryDto.ParentCategoryId
            };

            var createdCategory = await _categoryRepository.AddAsync(category);
            return CreatedResponse(createdCategory, $"/api/categories/{createdCategory.Id}", "Category created successfully");
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto updateCategoryDto)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFoundResponse("Category not found");

            category.Name = updateCategoryDto.Name;
            category.Description = updateCategoryDto.Description;
            category.ParentCategoryId = updateCategoryDto.ParentCategoryId;

            var updatedCategory = await _categoryRepository.UpdateAsync(category);
            return ApiResponse(updatedCategory, "Category updated successfully");
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFoundResponse("Category not found");

            await _categoryRepository.DeleteAsync(id);
            return ApiResponse(true, "Category deleted successfully");
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : BaseApiController
    {
        private readonly EcommerceDbContext _context;

        public NotificationsController(EcommerceDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return ApiResponse(notifications, "Notifications fetched successfully");
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFoundResponse("Notification not found");

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return ApiResponse(true, "Notification marked as read");
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return ApiResponse(true, "All notifications marked as read");
        }
    }
}
