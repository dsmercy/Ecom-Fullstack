using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace AIWebAPI
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message) = exception switch
            {
                ArgumentException => (400, exception.Message),
                UnauthorizedAccessException => (401, "Unauthorized"),
                InvalidOperationException => (400, exception.Message),
                _ => (500, "An error occurred while processing your request")
            };

            context.Response.StatusCode = statusCode;
            
            var response = CustomResponse<object>.FailResponse(
                message,
                exception is ArgumentException or InvalidOperationException 
                    ? new List<string> { exception.Message }
                    : null
            );

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }

    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;

        public RateLimitingMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var key = $"rate_limit_{context.Connection.RemoteIpAddress}";

            if (_cache.TryGetValue(key, out int requestCount))
            {
                if (requestCount >= 100) // 100 requests per minute
                {
                    context.Response.StatusCode = 429;
                    context.Response.ContentType = "application/json";
                    var response = CustomResponse<object>.FailResponse("Rate limit exceeded. Please try again later.");
                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }

                _cache.Set(key, requestCount + 1, TimeSpan.FromMinutes(1));
            }
            else
            {
                _cache.Set(key, 1, TimeSpan.FromMinutes(1));
            }

            await _next(context);
        }
    }
}
