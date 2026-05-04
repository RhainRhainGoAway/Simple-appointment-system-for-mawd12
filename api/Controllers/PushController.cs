using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.Models;
using AppointmentSystemAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PushController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _push;

        public PushController(ApplicationDbContext context, PushNotificationService push)
        {
            _context = context;
            _push = push;
        }

        [HttpGet("vapid-public-key")]
        public IActionResult GetVapidPublicKey()
        {
            var key = _push.GetPublicKey();
            if (string.IsNullOrWhiteSpace(key))
                return StatusCode(503, new { message = "Web Push is not configured on the server." });

            return Ok(new { publicKey = key });
        }

        [Authorize]
        [HttpPost("subscribe")]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeDto dto)
        {
            if (!_push.IsConfigured)
                return StatusCode(503, new { message = "Web Push is not configured on the server." });

            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim))
                return Unauthorized();

            if (dto?.Endpoint == null || dto.Keys?.P256dh == null || dto.Keys?.Auth == null)
                return BadRequest(new { message = "Invalid subscription payload" });

            var userId = int.Parse(userIdClaim);
            var now = DateTime.Now;

            var existing = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.Endpoint == dto.Endpoint && s.UserId == userId);

            if (existing == null)
            {
                var sub = new UserPushSubscription
                {
                    UserId = userId,
                    Endpoint = dto.Endpoint,
                    P256dh = dto.Keys.P256dh,
                    Auth = dto.Keys.Auth,
                    UserAgent = Request.Headers.UserAgent.ToString(),
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.PushSubscriptions.Add(sub);
            }
            else
            {
                existing.P256dh = dto.Keys.P256dh;
                existing.Auth = dto.Keys.Auth;
                existing.UserAgent = Request.Headers.UserAgent.ToString();
                existing.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Subscribed" });
        }

        [Authorize]
        [HttpPost("unsubscribe")]
        public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim))
                return Unauthorized();

            if (dto?.Endpoint == null)
                return BadRequest(new { message = "Invalid payload" });

            var userId = int.Parse(userIdClaim);

            var subs = await _context.PushSubscriptions
                .Where(s => s.UserId == userId && s.Endpoint == dto.Endpoint)
                .ToListAsync();

            if (subs.Count > 0)
            {
                _context.PushSubscriptions.RemoveRange(subs);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Unsubscribed" });
        }

        [Authorize]
        [HttpPost("test")]
        public async Task<IActionResult> SendTestPush()
        {
            if (!_push.IsConfigured)
                return StatusCode(503, new { message = "Web Push is not configured on the server." });

            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var sent = await _push.SendToUserAsync(
                userId,
                new PushPayload(
                    "Test notification",
                    "Push notifications are working for this account.",
                    "/appointment_system/index.html",
                    "test-push"),
                HttpContext.RequestAborted);

            return Ok(new { message = "Sent", subscriptionsNotified = sent });
        }

        public class SubscribeDto
        {
            public string? Endpoint { get; set; }
            public KeysDto? Keys { get; set; }
        }

        public class KeysDto
        {
            public string? P256dh { get; set; }
            public string? Auth { get; set; }
        }

        public class UnsubscribeDto
        {
            public string? Endpoint { get; set; }
        }
    }
}
