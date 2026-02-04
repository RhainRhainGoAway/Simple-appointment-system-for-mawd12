using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.Models;
using AppointmentSystemAPI.DTOs;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            // Validate email domain - only allow @santarosa.sti.edu.ph
            const string allowedDomain = "@santarosa.sti.edu.ph";
            if (string.IsNullOrEmpty(model.Email) || !model.Email.ToLower().EndsWith(allowedDomain))
            {
                return BadRequest(new { message = "Only @santarosa.sti.edu.ph email addresses are allowed." });
            }

            // Check if email already exists
            if (await _context.Students.AnyAsync(s => s.Email == model.Email))
            {
                return BadRequest(new { message = "Email is already registered!" });
            }

            // Create new student with hashed password
            var student = new Student
            {
                Name = model.Name,
                Email = model.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = model.Role,
                StudentNumber = model.Role == "student" ? model.StudentNumber : null,
                SectionId = model.Role == "student" ? model.SectionId : null
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registration successful!" });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            // Find user by email
            var user = await _context.Students
                .FirstOrDefaultAsync(s => s.Email == model.Email);

            // Verify password
            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
            {
                return Unauthorized(new { message = "Invalid email or password!" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Return user info and redirect path
            return Ok(new
            {
                token,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                studentNumber = user.StudentNumber,
                profilePicture = user.ProfilePicture,
                redirect = user.Role == "teacher"
                    ? "/pages/dashboard/teacher/dashboard.html"
                    : "/pages/dashboard/student/dashboard.html"
            });
        }

        // GET: api/auth/me - Get current user info (protected)
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Get user ID from JWT token
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Not authenticated" });

            var user = await _context.Students.FindAsync(int.Parse(userIdClaim));

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                studentNumber = user.StudentNumber,
                profilePicture = user.ProfilePicture
            });
        }

        // PUT: api/auth/profile/picture - Update profile picture
        [HttpPut("profile/picture")]
        public async Task<IActionResult> UpdateProfilePicture([FromBody] ProfilePictureDto model)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Not authenticated" });

            var user = await _context.Students.FindAsync(int.Parse(userIdClaim));

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Update profile picture (base64 string)
            user.ProfilePicture = model.ProfilePicture;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile picture updated successfully!", profilePicture = user.ProfilePicture });
        }

        private string GenerateJwtToken(Student user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.Id.ToString())
            };

            var expireHours = int.Parse(_configuration["Jwt:ExpireHours"] ?? "24");

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expireHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
