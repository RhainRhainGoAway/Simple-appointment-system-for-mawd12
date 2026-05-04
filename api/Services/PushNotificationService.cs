using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WebPush;

namespace AppointmentSystemAPI.Services
{
    public class PushNotificationService
    {
        private const string DefaultAppName = "STIConnect";
        private readonly ApplicationDbContext _context;
        private readonly WebPushOptions _options;

        public PushNotificationService(ApplicationDbContext context, IOptions<WebPushOptions> options)
        {
            _context = context;
            _options = options.Value;
        }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_options.PublicKey)
            && !string.IsNullOrWhiteSpace(_options.PrivateKey)
            && !string.IsNullOrWhiteSpace(_options.Subject);

        public string? GetPublicKey() => _options.PublicKey;

        public async Task<int> SendToUserAsync(int userId, PushPayload payload, CancellationToken cancellationToken = default)
        {
            if (!IsConfigured) return 0;

            var subs = await _context.PushSubscriptions
                .Where(s => s.UserId == userId)
                .ToListAsync(cancellationToken);

            if (subs.Count == 0) return 0;

            var recipientEmail = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(cancellationToken);

            var enrichedPayload = payload with
            {
                AccountEmail = recipientEmail,
                AppName = DefaultAppName
            };

            var vapid = new VapidDetails(_options.Subject!, _options.PublicKey!, _options.PrivateKey!);
            using var client = new WebPushClient();

            var sent = 0;
            foreach (var sub in subs)
            {
                var pushSub = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                try
                {
                    var json = enrichedPayload.ToJson();
                    await client.SendNotificationAsync(pushSub, json, vapid, cancellationToken);
                    sent++;
                }
                catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _context.PushSubscriptions.Remove(sub);
                    await _context.SaveChangesAsync(cancellationToken);
                }
                catch
                {
                    // ignore failures per-subscription; keep trying others
                }
            }

            return sent;
        }

        public async Task SendAppointmentStatusAsync(Appointment appointment, string type, string title, string body, CancellationToken cancellationToken = default)
        {
            var url = $"/appointment_system/pages/book-schedule/book-schedule.html";

            // Notify both parties if subscribed
            await SendToUserAsync(appointment.StudentId, new PushPayload(title, body, url, $"appointment-{type}-{appointment.Id}"), cancellationToken);
            await SendToUserAsync(appointment.TeacherId, new PushPayload(title, body, url, $"appointment-{type}-{appointment.Id}"), cancellationToken);
        }
    }

    public record PushPayload(
        string Title,
        string Body,
        string? Url = null,
        string? Tag = null,
        string? AccountEmail = null,
        string? AppName = null)
    {
        public string ToJson()
        {
            // keep it simple and predictable for the service worker
            var payload = new
            {
                title = Title,
                body = Body,
                url = Url,
                tag = Tag,
                accountEmail = AccountEmail,
                appName = AppName
            };
            return System.Text.Json.JsonSerializer.Serialize(payload);
        }
    }
}
