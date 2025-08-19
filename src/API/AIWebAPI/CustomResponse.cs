namespace AIWebAPI
{
    /// <summary>
    /// A generic API response wrapper for consistent response formatting.
    /// </summary>
    /// <typeparam name="T">The type of the response data.</typeparam>
    public class CustomResponse<T>
    {
        /// <summary>
        /// Indicates whether the request was successful.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Optional message with additional details (e.g., success, error, warnings).
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// The data payload (generic type).
        /// </summary>
        public T Data { get; set; }

        /// <summary>
        /// Optional list of validation or error details.
        /// </summary>
        public List<string> Errors { get; set; }

        /// <summary>
        /// Timestamp of the response.
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public CustomResponse() { }

        public CustomResponse(bool success, string message, T data, List<string> errors = null)
        {
            Success = success;
            Message = message;
            Data = data;
            Errors = errors ?? new List<string>();
            Timestamp = DateTime.UtcNow;
        }

        // Factory helpers for quick creation

        public static CustomResponse<T> SuccessResponse(T data, string message = "Request successful")
        {
            return new CustomResponse<T>(true, message, data);
        }

        public static CustomResponse<T> FailResponse(string message, List<string> errors = null)
        {
            return new CustomResponse<T>(false, message, default, errors);
        }
    }
}