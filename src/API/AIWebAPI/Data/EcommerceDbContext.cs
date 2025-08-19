using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AIWebAPI.Data
{
    public class EcommerceDbContext : IdentityDbContext<ApplicationUser>
    {
        public EcommerceDbContext(DbContextOptions<EcommerceDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<ProductTag> ProductTags { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Product configuration
            builder.Entity<Product>(entity =>
            {
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.Property(e => e.SalePrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Images).HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
            });

            // Order configuration
            builder.Entity<Order>(entity =>
            {
                entity.Property(e => e.SubTotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ShippingCost).HasColumnType("decimal(18,2)");
                entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            });

            // OrderItem configuration
            builder.Entity<OrderItem>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
            });

            // Promotion configuration
            builder.Entity<Promotion>(entity =>
            {
                entity.Property(e => e.Value).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MinimumOrderAmount).HasColumnType("decimal(18,2)");
            });

            // ProductTag many-to-many configuration
            builder.Entity<ProductTag>()
                .HasKey(pt => new { pt.ProductId, pt.TagId });

            builder.Entity<ProductTag>()
                .HasOne(pt => pt.Product)
                .WithMany(p => p.ProductTags)
                .HasForeignKey(pt => pt.ProductId);

            builder.Entity<ProductTag>()
                .HasOne(pt => pt.Tag)
                .WithMany(t => t.ProductTags)
                .HasForeignKey(pt => pt.TagId);

            // Category self-referencing relationship
            builder.Entity<Category>()
                .HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentCategoryId);

            // Indexes for performance
            builder.Entity<Product>()
                .HasIndex(p => p.SKU)
                .IsUnique();

            builder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();

            builder.Entity<Promotion>()
                .HasIndex(p => p.Code)
                .IsUnique();
        }

        // Seed Data
        public static class SeedData
        {
            public static async Task Initialize(EcommerceDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
            {
                // Ensure database is created
                await context.Database.EnsureCreatedAsync();

                // Seed roles
                string[] roles = { "Admin", "Seller", "Customer" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                    {
                        await roleManager.CreateAsync(new IdentityRole(role));
                    }
                }

                // Seed users
                if (!context.Users.Any())
                {
                    var users = new[]
                    {
                        new ApplicationUser
                        {
                            UserName = "admin@ecommerce.com",
                            Email = "admin@ecommerce.com",
                            FirstName = "Admin",
                            LastName = "User",
                            EmailConfirmed = true,
                            PhoneNumber = "1234567890",
                            Address = "123 Admin St, Business City, 12345",
                            DateOfBirth = DateTime.Parse("1990-01-01"),
                            IsActive = true
                        },
                        new ApplicationUser
                        {
                            UserName = "seller@ecommerce.com",
                            Email = "seller@ecommerce.com",
                            FirstName = "John",
                            LastName = "Seller",
                            EmailConfirmed = true,
                            PhoneNumber = "2345678901",
                            Address = "456 Seller Ave, Market City, 23456",
                            DateOfBirth = DateTime.Parse("1985-05-15"),
                            IsActive = true
                        },
                        new ApplicationUser
                        {
                            UserName = "customer@ecommerce.com",
                            Email = "customer@ecommerce.com",
                            FirstName = "Alice",
                            LastName = "Customer",
                            EmailConfirmed = true,
                            PhoneNumber = "3456789012",
                            Address = "789 Customer Rd, Shop City, 34567",
                            DateOfBirth = DateTime.Parse("1995-10-20"),
                            IsActive = true
                        }
                    };

                    foreach (var user in users)
                    {
                        await userManager.CreateAsync(user, "Password@123");
                    }

                    await userManager.AddToRoleAsync(users[0], "Admin");
                    await userManager.AddToRoleAsync(users[1], "Seller");
                    await userManager.AddToRoleAsync(users[2], "Customer");
                }

                // Seed categories
                if (!context.Categories.Any())
                {
                    var categories = new[]
                    {
                        new Category { Name = "Electronics", Description = "Electronic items and gadgets" },
                        new Category { Name = "Clothing", Description = "Fashion and apparel" },
                        new Category { Name = "Books", Description = "Books and literature" },
                        new Category { Name = "Home & Garden", Description = "Home improvement and garden items" }
                    };

                    context.Categories.AddRange(categories);
                    await context.SaveChangesAsync();
                }

                // Seed products
                if (!context.Products.Any())
                {
                    // Seed products for Electronics category
                    var electronics = await context.Categories.FirstAsync(c => c.Name == "Electronics");
                    var electronicsProducts = new[]
                    {
                        new Product {
                            Name = "Smartphone Pro Max",
                            Description = "Latest flagship smartphone with advanced features",
                            SKU = "ELEC001",
                            Price = 999.99m,
                            SalePrice = 899.99m,
                            StockQuantity = 50,
                            CategoryId = electronics.Id,
                            IsActive = true,
                            Images = new List<string> { "smartphone1.jpg", "smartphone2.jpg" },
                            AverageRating = 4.5,
                            ReviewCount = 128
                        },
                        new Product {
                            Name = "Ultra HD Smart TV",
                            Description = "65-inch 4K Smart TV with HDR",
                            SKU = "ELEC002",
                            Price = 1299.99m,
                            StockQuantity = 30,
                            CategoryId = electronics.Id,
                            IsActive = true,
                            Images = new List<string> { "tv1.jpg", "tv2.jpg" },
                            AverageRating = 4.8,
                            ReviewCount = 85
                        },
                        new Product {
                            Name = "Wireless Earbuds",
                            Description = "Premium wireless earbuds with noise cancellation",
                            SKU = "ELEC003",
                            Price = 199.99m,
                            SalePrice = 169.99m,
                            StockQuantity = 100,
                            CategoryId = electronics.Id,
                            IsActive = true,
                            Images = new List<string> { "earbuds1.jpg", "earbuds2.jpg" },
                            AverageRating = 4.6,
                            ReviewCount = 246
                        }
                    };

                    // Seed products for Clothing category
                    var clothing = await context.Categories.FirstAsync(c => c.Name == "Clothing");
                    var clothingProducts = new[]
                    {
                        new Product {
                            Name = "Premium Cotton T-Shirt",
                            Description = "Comfortable 100% cotton t-shirt",
                            SKU = "CLT001",
                            Price = 29.99m,
                            StockQuantity = 200,
                            CategoryId = clothing.Id,
                            IsActive = true,
                            Images = new List<string> { "tshirt1.jpg", "tshirt2.jpg" },
                            AverageRating = 4.3,
                            ReviewCount = 167
                        },
                        new Product {
                            Name = "Designer Jeans",
                            Description = "Premium denim jeans with perfect fit",
                            SKU = "CLT002",
                            Price = 89.99m,
                            SalePrice = 69.99m,
                            StockQuantity = 150,
                            CategoryId = clothing.Id,
                            IsActive = true,
                            Images = new List<string> { "jeans1.jpg", "jeans2.jpg" },
                            AverageRating = 4.7,
                            ReviewCount = 143
                        },
                        new Product {
                            Name = "Winter Jacket",
                            Description = "Warm and stylish winter jacket",
                            SKU = "CLT003",
                            Price = 149.99m,
                            StockQuantity = 75,
                            CategoryId = clothing.Id,
                            IsActive = true,
                            Images = new List<string> { "jacket1.jpg", "jacket2.jpg" },
                            AverageRating = 4.4,
                            ReviewCount = 89
                        }
                    };

                    // Seed products for Books category
                    var books = await context.Categories.FirstAsync(c => c.Name == "Books");
                    var booksProducts = new[]
                    {
                        new Product {
                            Name = "The Art of Programming",
                            Description = "Comprehensive guide to programming fundamentals",
                            SKU = "BK001",
                            Price = 49.99m,
                            StockQuantity = 100,
                            CategoryId = books.Id,
                            IsActive = true,
                            Images = new List<string> { "book1.jpg" },
                            AverageRating = 4.9,
                            ReviewCount = 215
                        },
                        new Product {
                            Name = "Business Strategy Guide",
                            Description = "Modern approach to business strategy",
                            SKU = "BK002",
                            Price = 34.99m,
                            SalePrice = 29.99m,
                            StockQuantity = 80,
                            CategoryId = books.Id,
                            IsActive = true,
                            Images = new List<string> { "book2.jpg" },
                            AverageRating = 4.5,
                            ReviewCount = 67
                        },
                        new Product {
                            Name = "Cooking Masterclass",
                            Description = "Professional cooking techniques and recipes",
                            SKU = "BK003",
                            Price = 39.99m,
                            StockQuantity = 120,
                            CategoryId = books.Id,
                            IsActive = true,
                            Images = new List<string> { "book3.jpg" },
                            AverageRating = 4.7,
                            ReviewCount = 156
                        }
                    };

                    // Seed products for Home & Garden category
                    var homeGarden = await context.Categories.FirstAsync(c => c.Name == "Home & Garden");
                    var homeGardenProducts = new[]
                    {
                        new Product {
                            Name = "Garden Tool Set",
                            Description = "Complete set of essential garden tools",
                            SKU = "HG001",
                            Price = 79.99m,
                            SalePrice = 59.99m,
                            StockQuantity = 60,
                            CategoryId = homeGarden.Id,
                            IsActive = true,
                            Images = new List<string> { "tools1.jpg", "tools2.jpg" },
                            AverageRating = 4.6,
                            ReviewCount = 94
                        },
                        new Product {
                            Name = "Smart Plant Pot",
                            Description = "Self-watering pot with moisture sensor",
                            SKU = "HG002",
                            Price = 39.99m,
                            StockQuantity = 150,
                            CategoryId = homeGarden.Id,
                            IsActive = true,
                            Images = new List<string> { "pot1.jpg", "pot2.jpg" },
                            AverageRating = 4.4,
                            ReviewCount = 73
                        },
                        new Product {
                            Name = "Outdoor Furniture Set",
                            Description = "4-piece weather-resistant furniture set",
                            SKU = "HG003",
                            Price = 599.99m,
                            SalePrice = 499.99m,
                            StockQuantity = 25,
                            CategoryId = homeGarden.Id,
                            IsActive = true,
                            Images = new List<string> { "furniture1.jpg", "furniture2.jpg" },
                            AverageRating = 4.8,
                            ReviewCount = 42
                        }
                    };

                    // Add all products to context
                    context.Products.AddRange(electronicsProducts);
                    context.Products.AddRange(clothingProducts);
                    context.Products.AddRange(booksProducts);
                    context.Products.AddRange(homeGardenProducts);
                    await context.SaveChangesAsync();
                }

                // Seed tags
                if (!context.Tags.Any())
                {
                    var tags = new[]
                    {
                        new Tag { Name = "Featured" },
                        new Tag { Name = "New Arrival" },
                        new Tag { Name = "Best Seller" },
                        new Tag { Name = "On Sale" }
                    };

                    context.Tags.AddRange(tags);
                    await context.SaveChangesAsync();

                    // Seed ProductTags
                    var products = await context.Products.ToListAsync();
                    var tagsList = await context.Tags.ToListAsync();

                    var productTags = new List<ProductTag>();
                    foreach (var product in products)
                    {
                        // Add "Featured" tag to products with rating >= 4.7
                        if (product.AverageRating >= 4.7)
                        {
                            productTags.Add(new ProductTag { ProductId = product.Id, TagId = tagsList[0].Id });
                        }

                        // Add "Best Seller" tag to products with review count > 150
                        if (product.ReviewCount > 150)
                        {
                            productTags.Add(new ProductTag { ProductId = product.Id, TagId = tagsList[2].Id });
                        }

                        // Add "On Sale" tag to products with SalePrice
                        if (product.SalePrice.HasValue)
                        {
                            productTags.Add(new ProductTag { ProductId = product.Id, TagId = tagsList[3].Id });
                        }
                    }

                    context.ProductTags.AddRange(productTags);
                    await context.SaveChangesAsync();
                }

                // Seed Reviews
                if (!context.Reviews.Any())
                {
                    var customer = await context.Users.FirstAsync(u => u.Email == "customer@ecommerce.com");
                    var products = await context.Products.ToListAsync();

                    var reviews = products.Select(product => new Review
                    {
                        ProductId = product.Id,
                        UserId = customer.Id,
                        Rating = (int)Math.Round(product.AverageRating),
                        Comment = $"Great {product.Name}! Exactly as described.",
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30))
                    });

                    context.Reviews.AddRange(reviews);
                    await context.SaveChangesAsync();
                }

                // Seed WishlistItems
                if (!context.WishlistItems.Any())
                {
                    var customer = await context.Users.FirstAsync(u => u.Email == "customer@ecommerce.com");
                    var products = await context.Products.Take(5).ToListAsync(); // Add first 5 products to wishlist

                    var wishlistItems = products.Select(product => new WishlistItem
                    {
                        UserId = customer.Id,
                        ProductId = product.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30))
                    });

                    context.WishlistItems.AddRange(wishlistItems);
                    await context.SaveChangesAsync();
                }

                // Seed Promotions
                if (!context.Promotions.Any())
                {
                    var promotions = new[]
                    {
                        new Promotion
                        {
                            Code = "WELCOME10",
                            Type = PromotionType.Percentage,
                            Value = 10,
                            MinimumOrderAmount = 50,
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(1),
                            UsageLimit = 100,
                            IsActive = true
                        },
                        new Promotion
                        {
                            Code = "FLAT20",
                            Type = PromotionType.FixedAmount,
                            Value = 20,
                            MinimumOrderAmount = 200,
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(1),
                            IsActive = true
                        },
                        new Promotion
                        {
                            Code = "FREESHIP",
                            Type = PromotionType.FreeShipping,
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddDays(7),
                            IsActive = true
                        }
                    };

                    context.Promotions.AddRange(promotions);
                    await context.SaveChangesAsync();
                }

                // Seed Orders
                if (!context.Orders.Any())
                {
                    var customer = await context.Users.FirstAsync(u => u.Email == "customer@ecommerce.com");
                    var products = await context.Products.Take(3).ToListAsync(); // Use first 3 products for orders

                    var orders = new[]
                    {
                        new Order
                        {
                            UserId = customer.Id,
                            OrderNumber = "ORD-2024-001",
                            Status = OrderStatus.Delivered,
                            SubTotal = 1299.97m,
                            TaxAmount = 234m,
                            ShippingCost = 0m,
                            DiscountAmount = 130m,
                            TotalAmount = 1403.97m,
                            ShippingAddress = customer.Address,
                            BillingAddress = customer.Address,
                            PaymentMethod = "Credit Card",
                            PaymentStatus = PaymentStatus.Completed,
                            CreatedAt = DateTime.UtcNow.AddDays(-30),
                            ShippedAt = DateTime.UtcNow.AddDays(-27),
                            DeliveredAt = DateTime.UtcNow.AddDays(-25),
                            TrackingNumber = "TRK123456789",
                            CourierService = "Express Delivery"
                        },
                        new Order
                        {
                            UserId = customer.Id,
                            OrderNumber = "ORD-2024-002",
                            Status = OrderStatus.Shipped,
                            SubTotal = 499.97m,
                            TaxAmount = 90m,
                            ShippingCost = 10m,
                            DiscountAmount = 50m,
                            TotalAmount = 549.97m,
                            ShippingAddress = customer.Address,
                            BillingAddress = customer.Address,
                            PaymentMethod = "PayPal",
                            PaymentStatus = PaymentStatus.Completed,
                            CreatedAt = DateTime.UtcNow.AddDays(-5),
                            ShippedAt = DateTime.UtcNow.AddDays(-2),
                            TrackingNumber = "TRK987654321",
                            CourierService = "Standard Shipping"
                        }
                    };

                    context.Orders.AddRange(orders);
                    await context.SaveChangesAsync();

                    // Seed OrderItems
                    var orderItems = new List<OrderItem>();
                    for (int i = 0; i < orders.Length; i++)
                    {
                        orderItems.Add(new OrderItem
                        {
                            OrderId = orders[i].Id,
                            ProductId = products[i].Id,
                            Quantity = 2,
                            UnitPrice = products[i].Price,
                            TotalPrice = products[i].Price * 2
                        });
                    }

                    context.OrderItems.AddRange(orderItems);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}

