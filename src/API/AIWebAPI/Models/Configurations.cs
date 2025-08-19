namespace AIWebAPI.Models
{
    public class PaymentSettings
    {
        public string StripeSecretKey { get; set; } = string.Empty;
        public string StripePublishableKey { get; set; } = string.Empty;
        public string PayPalClientId { get; set; } = string.Empty;
        public string PayPalClientSecret { get; set; } = string.Empty;
        public string RazorpayKeyId { get; set; } = string.Empty;
        public string RazorpayKeySecret { get; set; } = string.Empty;
    }

    public class EmailSettings
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; }
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }

    public class JwtSettings
    {
        public string SecretKey { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpirationInMinutes { get; set; }
    }
}
