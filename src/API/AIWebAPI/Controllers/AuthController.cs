//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Mvc;
//using AIWebAPI.DTOs;
//using AIWebAPI.Services;
//using System.Security.Claims;

//namespace AIWebAPI.Controllers
//{
//    public class AuthController : BaseApiController
//    {
//        private readonly IAuthService _authService;

//        public AuthController(IAuthService authService)
//        {
//            _authService = authService;
//        }

//        [HttpPost("register")]
//        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
//        {
//            try
//            {
//                var result = await _authService.RegisterAsync(registerDto);
//                return CreatedResponse(result, "/api/auth/login", "User registered successfully");
//            }
//            catch (ArgumentException ex)
//            {
//                return ApiError(ex.Message, errors: new List<string> { ex.Message });
//            }
//        }

//        [HttpPost("login")]
//        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
//        {
//            var result = await _authService.LoginAsync(loginDto);
            
//            if (result == null)
//                return ApiError("Invalid email or password");

//            return ApiResponse(result, "Login successful");
//        }

//        [Authorize]
//        [HttpPost("logout")]
//        public async Task<IActionResult> Logout()
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            var result = await _authService.LogoutAsync(userId!);

//            if (!result)
//                return ApiError("Logout failed");

//            return ApiResponse(true, "Logged out successfully");
//        }

//        [HttpPost("refresh-token")]
//        public async Task<IActionResult> RefreshToken([FromBody] string refreshToken)
//        {
//            var result = await _authService.RefreshTokenAsync(refreshToken);
            
//            if (result == null)
//                return ApiError("Invalid or expired refresh token");

//            return ApiResponse(result, "Token refreshed successfully");
//        }

//        [Authorize]
//        [HttpPost("change-password")]
//        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
//        {
//            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
//            var result = await _authService.ChangePasswordAsync(userId!, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

//            if (!result)
//                return ApiError("Password change failed");

//            return ApiResponse(true, "Password changed successfully");
//        }
//    }
//}