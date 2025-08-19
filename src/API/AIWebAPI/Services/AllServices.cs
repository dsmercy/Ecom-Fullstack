using AIWebAPI.Data;
using AIWebAPI.DTOs;
using AIWebAPI.Models;
using AIWebAPI.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AIWebAPI.Services
{
    // Authentication Service
    public interface IAuthService
    {
        Task<TokenResponseDto> RegisterAsync(RegisterDto registerDto, string role = "Customer");
        Task<TokenResponseDto?> LoginAsync(LoginDto loginDto);
        Task<bool> LogoutAsync(string userId);
        Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        public async Task<TokenResponseDto> RegisterAsync(RegisterDto registerDto, string role = "Customer")
        {
            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PhoneNumber = registerDto.PhoneNumber,
                DateOfBirth = registerDto.DateOfBirth
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, role);
                return await GenerateTokenAsync(user);
            }

            throw new ArgumentException(string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        public async Task<TokenResponseDto?> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                return await GenerateTokenAsync(user);
            }
            return null;
        }

        public async Task<bool> LogoutAsync(string userId)
        {
            // Implement token blacklisting logic here if needed
            await Task.CompletedTask;
            return true;
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            // Implement refresh token logic
            await Task.CompletedTask;
            return null;
        }

        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
                return result.Succeeded;
            }
            return false;
        }

        private async Task<TokenResponseDto> GenerateTokenAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? "")
            };

            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationInMinutes"]));

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new TokenResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expires = expires,
                RefreshToken = Guid.NewGuid().ToString()
            };
        }
    }

    // Product Service
    public interface IProductService
    {
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<PaginatedResult<ProductDto>> SearchProductsAsync(ProductSearchDto searchDto);
        Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto);
        Task<ProductDto?> UpdateProductAsync(int id, CreateProductDto updateProductDto);
        Task<bool> DeleteProductAsync(int id);
        Task<List<ProductDto>> GetFeaturedProductsAsync();
        Task<List<ProductDto>> GetRelatedProductsAsync(int productId);
    }

    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly ICategoryRepository _categoryRepository;

        public ProductService(IProductRepository productRepository, ICategoryRepository categoryRepository)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            return product != null ? MapToProductDto(product) : null;
        }

        public async Task<PaginatedResult<ProductDto>> SearchProductsAsync(ProductSearchDto searchDto)
        {
            var result = await _productRepository.SearchProductsAsync(searchDto);
            return new PaginatedResult<ProductDto>
            {
                Items = result.Items.Select(MapToProductDto).ToList(),
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize
            };
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto)
        {
            var product = new Product
            {
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                SKU = createProductDto.SKU,
                Price = createProductDto.Price,
                SalePrice = createProductDto.SalePrice,
                StockQuantity = createProductDto.StockQuantity,
                CategoryId = createProductDto.CategoryId,
                ImageUrl = createProductDto.ImageUrl,
                Images = createProductDto.Images
            };

            var createdProduct = await _productRepository.AddAsync(product);
            return MapToProductDto(createdProduct);
        }

        public async Task<ProductDto?> UpdateProductAsync(int id, CreateProductDto updateProductDto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return null;

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.SKU = updateProductDto.SKU;
            product.Price = updateProductDto.Price;
            product.SalePrice = updateProductDto.SalePrice;
            product.StockQuantity = updateProductDto.StockQuantity;
            product.CategoryId = updateProductDto.CategoryId;
            product.ImageUrl = updateProductDto.ImageUrl;
            product.Images = updateProductDto.Images;
            product.UpdatedAt = DateTime.UtcNow;

            var updatedProduct = await _productRepository.UpdateAsync(product);
            return MapToProductDto(updatedProduct);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null) return false;

            product.IsActive = false;
            await _productRepository.UpdateAsync(product);
            return true;
        }

        public async Task<List<ProductDto>> GetFeaturedProductsAsync()
        {
            var products = await _productRepository.GetAllAsync();
            var featuredProducts = await products.Where(p => p.IsActive && p.AverageRating >= 4.0)
                .OrderByDescending(p => p.AverageRating)
                .Take(10)
                .ToListAsync();

            return featuredProducts.Select(MapToProductDto).ToList();
        }

        public async Task<List<ProductDto>> GetRelatedProductsAsync(int productId)
        {
            var product = await _productRepository.GetByIdAsync(productId);
            if (product == null) return new List<ProductDto>();

            var relatedProducts = await _productRepository.GetProductsByCategoryAsync(product.CategoryId);
            return relatedProducts.Where(p => p.Id != productId)
                .Take(5)
                .Select(MapToProductDto)
                .ToList();
        }

        private ProductDto MapToProductDto(Product product)
        {
            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                SKU = product.SKU,
                Price = product.Price,
                SalePrice = product.SalePrice,
                StockQuantity = product.StockQuantity,
                ImageUrl = product.ImageUrl,
                Images = product.Images,
                AverageRating = product.AverageRating,
                ReviewCount = product.ReviewCount,
                CategoryName = product.Category?.Name ?? "",
                Tags = product.ProductTags?.Select(pt => pt.Tag.Name).ToList() ?? new List<string>()
            };
        }
    }

    // Cart Service
    public interface ICartService
    {
        Task<List<CartItemDto>> GetCartItemsAsync(string userId);
        Task<CartItemDto> AddToCartAsync(string userId, AddToCartDto addToCartDto);
        Task<bool> UpdateCartItemAsync(string userId, int cartItemId, int quantity);
        Task<bool> RemoveFromCartAsync(string userId, int cartItemId);
        Task<bool> ClearCartAsync(string userId);
        Task<decimal> GetCartTotalAsync(string userId);
    }

    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;

        public CartService(ICartRepository cartRepository, IProductRepository productRepository)
        {
            _cartRepository = cartRepository;
            _productRepository = productRepository;
        }

        public async Task<List<CartItemDto>> GetCartItemsAsync(string userId)
        {
            var cartItems = await _cartRepository.GetCartItemsAsync(userId);
            return cartItems.Select(ci => new CartItemDto
            {
                Id = ci.Id,
                ProductId = ci.ProductId,
                ProductName = ci.Product.Name,
                Price = ci.Product.SalePrice ?? ci.Product.Price,
                Quantity = ci.Quantity,
                Total = (ci.Product.SalePrice ?? ci.Product.Price) * ci.Quantity,
                ImageUrl = ci.Product.ImageUrl
            }).ToList();
        }

        public async Task<CartItemDto> AddToCartAsync(string userId, AddToCartDto addToCartDto)
        {
            var product = await _productRepository.GetByIdAsync(addToCartDto.ProductId);
            if (product == null || product.StockQuantity < addToCartDto.Quantity)
                throw new InvalidOperationException("Product not available or insufficient stock");

            var cartItem = await _cartRepository.AddToCartAsync(userId, addToCartDto.ProductId, addToCartDto.Quantity);

            return new CartItemDto
            {
                Id = cartItem.Id,
                ProductId = cartItem.ProductId,
                ProductName = product.Name,
                Price = product.SalePrice ?? product.Price,
                Quantity = cartItem.Quantity,
                Total = (product.SalePrice ?? product.Price) * cartItem.Quantity,
                ImageUrl = product.ImageUrl
            };
        }

        public async Task<bool> UpdateCartItemAsync(string userId, int cartItemId, int quantity)
        {
            var cartItems = await _cartRepository.GetCartItemsAsync(userId);
            var cartItem = cartItems.FirstOrDefault(ci => ci.Id == cartItemId);

            if (cartItem == null || cartItem.Product.StockQuantity < quantity)
                return false;

            await _cartRepository.UpdateCartItemAsync(cartItemId, quantity);
            return true;
        }

        public async Task<bool> RemoveFromCartAsync(string userId, int cartItemId)
        {
            var cartItems = await _cartRepository.GetCartItemsAsync(userId);
            if (!cartItems.Any(ci => ci.Id == cartItemId))
                return false;

            await _cartRepository.RemoveFromCartAsync(cartItemId);
            return true;
        }

        public async Task<bool> ClearCartAsync(string userId)
        {
            await _cartRepository.ClearCartAsync(userId);
            return true;
        }

        public async Task<decimal> GetCartTotalAsync(string userId)
        {
            var cartItems = await _cartRepository.GetCartItemsAsync(userId);
            return cartItems.Sum(ci => (ci.Product.SalePrice ?? ci.Product.Price) * ci.Quantity);
        }
    }

    // Order Service
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(string userId, CheckoutDto checkoutDto);
        Task<List<OrderDto>> GetUserOrdersAsync(string userId);
        Task<OrderDto?> GetOrderByIdAsync(int orderId, string userId);
        Task<bool> CancelOrderAsync(int orderId, string userId);
        Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus status);
        Task<OrderDto?> GetOrderByIdForAdminAsync(int orderId);
    }

    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICartRepository _cartRepository;
        private readonly IInventoryService _inventoryService;
        private readonly IPromotionService _promotionService;
        private readonly INotificationService _notificationService;

        public OrderService(
            IOrderRepository orderRepository,
            ICartRepository cartRepository,
            IInventoryService inventoryService,
            IPromotionService promotionService,
            INotificationService notificationService)
        {
            _orderRepository = orderRepository;
            _cartRepository = cartRepository;
            _inventoryService = inventoryService;
            _promotionService = promotionService;
            _notificationService = notificationService;
        }

        public async Task<OrderDto> CreateOrderAsync(string userId, CheckoutDto checkoutDto)
        {
            var cartItems = await _cartRepository.GetCartItemsAsync(userId);
            if (!cartItems.Any())
                throw new InvalidOperationException("Cart is empty");

            // Reserve inventory
            foreach (var item in cartItems)
            {
                var reserved = await _inventoryService.ReserveStockAsync(item.ProductId, item.Quantity);
                if (!reserved)
                    throw new InvalidOperationException($"Insufficient stock for product {item.Product.Name}");
            }

            var subtotal = cartItems.Sum(ci => (ci.Product.SalePrice ?? ci.Product.Price) * ci.Quantity);
            var taxAmount = subtotal * 0.18m; // 18% tax
            var shippingCost = subtotal > 500 ? 0 : 50; // Free shipping above 500
            var discountAmount = 0m;

            // Apply promotion if provided
            if (!string.IsNullOrEmpty(checkoutDto.PromotionCode))
            {
                discountAmount = await _promotionService.ApplyPromotionAsync(checkoutDto.PromotionCode, subtotal);
            }

            var totalAmount = subtotal + taxAmount + shippingCost - discountAmount;

            var order = new Order
            {
                UserId = userId,
                OrderNumber = await _orderRepository.GenerateOrderNumberAsync(),
                Status = OrderStatus.Pending,
                SubTotal = subtotal,
                TaxAmount = taxAmount,
                ShippingCost = shippingCost,
                DiscountAmount = discountAmount,
                TotalAmount = totalAmount,
                ShippingAddress = checkoutDto.ShippingAddress,
                BillingAddress = checkoutDto.BillingAddress,
                PaymentMethod = checkoutDto.PaymentMethod,
                PaymentStatus = PaymentStatus.Pending,
                OrderItems = cartItems.Select(ci => new OrderItem
                {
                    ProductId = ci.ProductId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.Product.SalePrice ?? ci.Product.Price,
                    TotalPrice = (ci.Product.SalePrice ?? ci.Product.Price) * ci.Quantity
                }).ToList()
            };

            var createdOrder = await _orderRepository.AddAsync(order);
            await _cartRepository.ClearCartAsync(userId);

            // Send notification
            await _notificationService.SendOrderConfirmationAsync(userId, createdOrder.Id);

            return MapToOrderDto(createdOrder);
        }

        public async Task<List<OrderDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _orderRepository.GetUserOrdersAsync(userId);
            return orders.Select(MapToOrderDto).ToList();
        }

        public async Task<OrderDto?> GetOrderByIdAsync(int orderId, string userId)
        {
            var order = await _orderRepository.GetOrderWithItemsAsync(orderId);
            if (order?.UserId != userId) return null;

            return MapToOrderDto(order);
        }

        public async Task<bool> CancelOrderAsync(int orderId, string userId)
        {
            var order = await _orderRepository.GetOrderWithItemsAsync(orderId);
            if (order?.UserId != userId || order.Status != OrderStatus.Pending)
                return false;

            order.Status = OrderStatus.Cancelled;
            await _orderRepository.UpdateAsync(order);

            // Release reserved stock
            foreach (var item in order.OrderItems)
            {
                await _inventoryService.ReleaseStockAsync(item.ProductId, item.Quantity);
            }

            return true;
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, OrderStatus status)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) return false;

            order.Status = status;

            if (status == OrderStatus.Shipped)
                order.ShippedAt = DateTime.UtcNow;
            else if (status == OrderStatus.Delivered)
                order.DeliveredAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            await _notificationService.SendOrderUpdateAsync(order.UserId, orderId, status);

            return true;
        }

        public async Task<OrderDto?> GetOrderByIdForAdminAsync(int orderId)
        {
            var order = await _orderRepository.GetOrderWithItemsAsync(orderId);
            return order != null ? MapToOrderDto(order) : null;
        }

        private OrderDto MapToOrderDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                CreatedAt = order.CreatedAt,
                Items = order.OrderItems.Select(oi => new OrderItemDto
                {
                    ProductName = oi.Product?.Name ?? "Product",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice
                }).ToList()
            };
        }
    }

    // Payment Service
    public interface IPaymentService
    {
        Task<string> CreatePaymentIntentAsync(int orderId);
        Task<bool> ProcessPaymentAsync(int orderId, string paymentIntentId);
        Task<bool> RefundPaymentAsync(int orderId, decimal amount);
    }

    public class PaymentService : IPaymentService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IConfiguration _configuration;
        private readonly PaymentSettings _paymentSettings;

        public PaymentService(IOrderRepository orderRepository, IConfiguration configuration, IOptions<PaymentSettings> paymentSettings)
        {
            _orderRepository = orderRepository;
            _configuration = configuration;
            _paymentSettings = paymentSettings.Value;
        }

        public async Task<string> CreatePaymentIntentAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            // Implementation for Stripe, PayPal, Razorpay etc.
            // This is a simplified version
            var paymentIntentId = $"pi_{Guid.NewGuid():N}";

            order.PaymentIntentId = paymentIntentId;
            await _orderRepository.UpdateAsync(order);

            return paymentIntentId;
        }

        public async Task<bool> ProcessPaymentAsync(int orderId, string paymentIntentId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order?.PaymentIntentId != paymentIntentId)
                return false;

            // Process payment with payment gateway
            // This is simplified - in real implementation, you'd integrate with actual payment providers

            order.PaymentStatus = PaymentStatus.Completed;
            order.Status = OrderStatus.Confirmed;
            await _orderRepository.UpdateAsync(order);

            return true;
        }

        public async Task<bool> RefundPaymentAsync(int orderId, decimal amount)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order?.PaymentStatus != PaymentStatus.Completed)
                return false;

            // Process refund with payment gateway
            // This is simplified

            order.PaymentStatus = PaymentStatus.Refunded;
            order.Status = OrderStatus.Refunded;
            await _orderRepository.UpdateAsync(order);

            return true;
        }
    }

    // Inventory Service
    public interface IInventoryService
    {
        Task<bool> ReserveStockAsync(int productId, int quantity);
        Task ReleaseStockAsync(int productId, int quantity);
        Task<List<Product>> GetLowStockProductsAsync(int threshold = 10);
        Task UpdateStockAsync(int productId, int newQuantity);
    }

    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;
        private readonly INotificationService _notificationService;

        public InventoryService(IInventoryRepository inventoryRepository, INotificationService notificationService)
        {
            _inventoryRepository = inventoryRepository;
            _notificationService = notificationService;
        }

        public async Task<bool> ReserveStockAsync(int productId, int quantity)
        {
            return await _inventoryRepository.ReserveStockAsync(productId, quantity);
        }

        public async Task ReleaseStockAsync(int productId, int quantity)
        {
            await _inventoryRepository.ReleaseStockAsync(productId, quantity);
        }

        public async Task<List<Product>> GetLowStockProductsAsync(int threshold = 10)
        {
            return await _inventoryRepository.GetLowStockProductsAsync(threshold);
        }

        public async Task UpdateStockAsync(int productId, int newQuantity)
        {
            var currentStock = await _inventoryRepository.GetStockQuantityAsync(productId);
            await _inventoryRepository.ReleaseStockAsync(productId, newQuantity - currentStock);

            if (newQuantity <= 10)
            {
                await _notificationService.SendLowStockAlertAsync(productId);
            }
        }
    }

    // Notification Service
    public interface INotificationService
    {
        Task SendOrderConfirmationAsync(string userId, int orderId);
        Task SendOrderUpdateAsync(string userId, int orderId, OrderStatus status);
        Task SendLowStockAlertAsync(int productId);
        Task SendWelcomeEmailAsync(string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly EcommerceDbContext _context;
        private readonly EmailSettings _emailSettings;

        public NotificationService(EcommerceDbContext context, IOptions<EmailSettings> emailSettings)
        {
            _context = context;
            _emailSettings = emailSettings.Value;
        }

        public async Task SendOrderConfirmationAsync(string userId, int orderId)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = "Order Confirmed",
                Message = $"Your order #{orderId} has been confirmed and is being processed.",
                Type = NotificationType.Order
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Send email notification (implementation needed)
        }

        public async Task SendOrderUpdateAsync(string userId, int orderId, OrderStatus status)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = "Order Update",
                Message = $"Your order #{orderId} status has been updated to: {status}",
                Type = NotificationType.Order
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task SendLowStockAlertAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null)
            {
                // Send alert to admins
                var adminUsers = await _context.Users
                    .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id &&
                              _context.Roles.Any(r => r.Id == ur.RoleId && r.Name == "Admin")))
                    .ToListAsync();

                foreach (var admin in adminUsers)
                {
                    var notification = new Notification
                    {
                        UserId = admin.Id,
                        Title = "Low Stock Alert",
                        Message = $"Product '{product.Name}' is running low on stock. Current quantity: {product.StockQuantity}",
                        Type = NotificationType.System
                    };

                    _context.Notifications.Add(notification);
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task SendWelcomeEmailAsync(string userId)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = "Welcome!",
                Message = "Welcome to our e-commerce platform. Thank you for joining us!",
                Type = NotificationType.System
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }

    // Promotion Service
    public interface IPromotionService
    {
        Task<decimal> ApplyPromotionAsync(string code, decimal orderAmount);
        Task<List<Promotion>> GetActivePromotionsAsync();
        Task<Promotion> CreatePromotionAsync(Promotion promotion);
    }

    public class PromotionService : IPromotionService
    {
        private readonly IPromotionRepository _promotionRepository;

        public PromotionService(IPromotionRepository promotionRepository)
        {
            _promotionRepository = promotionRepository;
        }

        public async Task<decimal> ApplyPromotionAsync(string code, decimal orderAmount)
        {
            var promotion = await _promotionRepository.GetPromotionByCodeAsync(code);
            if (promotion == null) return 0;

            if (promotion.MinimumOrderAmount.HasValue && orderAmount < promotion.MinimumOrderAmount)
                return 0;

            if (promotion.UsageLimit.HasValue && promotion.UsageCount >= promotion.UsageLimit)
                return 0;

            decimal discount = promotion.Type switch
            {
                PromotionType.Percentage => orderAmount * (promotion.Value / 100),
                PromotionType.FixedAmount => promotion.Value,
                PromotionType.FreeShipping => 50, // Assuming shipping cost is 50
                _ => 0
            };

            await _promotionRepository.IncrementUsageCountAsync(promotion.Id);
            return discount;
        }

        public async Task<List<Promotion>> GetActivePromotionsAsync()
        {
            return await _promotionRepository.GetActivePromotionsAsync();
        }

        public async Task<Promotion> CreatePromotionAsync(Promotion promotion)
        {
            return await _promotionRepository.AddAsync(promotion);
        }
    }

    // Shipping Service
    public interface IShippingService
    {
        Task<decimal> CalculateShippingCostAsync(string address, decimal weight);
        Task<string> CreateShipmentAsync(int orderId);
        Task<string?> GetTrackingInfoAsync(string trackingNumber);
    }

    public class ShippingService : IShippingService
    {
        private readonly IOrderRepository _orderRepository;

        public ShippingService(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
        }

        public async Task<decimal> CalculateShippingCostAsync(string address, decimal weight)
        {
            // Implement shipping cost calculation logic
            // This could integrate with shipping APIs like FedEx, UPS, DHL etc.
            await Task.CompletedTask;

            // Simplified calculation
            return weight * 10; // $10 per kg
        }

        public async Task<string> CreateShipmentAsync(int orderId)
        {
            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
                throw new ArgumentException("Order not found");

            // Create shipment with courier service
            var trackingNumber = $"TRK{DateTime.UtcNow:yyyyMMdd}{orderId:D6}";

            order.TrackingNumber = trackingNumber;
            order.CourierService = "Express Delivery";
            order.Status = OrderStatus.Shipped;
            order.ShippedAt = DateTime.UtcNow;

            await _orderRepository.UpdateAsync(order);
            return trackingNumber;
        }

        public async Task<string?> GetTrackingInfoAsync(string trackingNumber)
        {
            // Integrate with courier API to get tracking information
            await Task.CompletedTask;
            return $"Package with tracking number {trackingNumber} is in transit.";
        }
    }
}
