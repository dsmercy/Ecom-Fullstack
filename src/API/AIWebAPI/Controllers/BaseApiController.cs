using Microsoft.AspNetCore.Mvc;

namespace AIWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        protected IActionResult ApiResponse<T>(T data, string message = "Request successful")
        {
            return Ok(CustomResponse<T>.SuccessResponse(data, message));
        }

        protected IActionResult ApiResponse<T>(T data, int statusCode, string message = "Request successful")
        {
            var response = CustomResponse<T>.SuccessResponse(data, message);
            return StatusCode(statusCode, response);
        }

        protected IActionResult ApiError<T>(string message, int statusCode = 400, List<string>? errors = null)
        {
            var response = CustomResponse<T>.FailResponse(message, errors);
            return StatusCode(statusCode, response);
        }

        protected IActionResult ApiError(string message, int statusCode = 400, List<string>? errors = null)
        {
            var response = CustomResponse<object>.FailResponse(message, errors);
            return StatusCode(statusCode, response);
        }

        protected IActionResult NotFoundResponse(string message = "Resource not found")
        {
            var response = CustomResponse<object>.FailResponse(message);
            return NotFound(response);
        }

        protected IActionResult CreatedResponse<T>(T data, string location, string message = "Resource created successfully")
        {
            var response = CustomResponse<T>.SuccessResponse(data, message);
            return Created(location, response);
        }
    }
}