using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystemAPI.Services
{
    public class AppointmentReminderWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        // Polling is simplest for this codebase (no Hangfire/Quartz dependencies)
        private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

        public AppointmentReminderWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await TickAsync(stoppingToken);
                }
                catch
                {
                    // swallow worker loop errors to keep service alive
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }

        private async Task TickAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var push = scope.ServiceProvider.GetRequiredService<PushNotificationService>();

            if (!push.IsConfigured) return;

            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            // Only today’s accepted appointments can trigger reminders.
            var appointments = await context.Appointments
                .Where(a => a.Status == "accepted" && a.AppointmentDate == today)
                .ToListAsync(stoppingToken);

            foreach (var appt in appointments)
            {
                var start = appt.AppointmentDate.ToDateTime(appt.StartTime);

                var minutesToStart = (start - now).TotalMinutes;

                if (minutesToStart <= 5.0 && minutesToStart > 4.0)
                {
                    await TrySendOnceAsync(context, push, appt, "reminder_5min", stoppingToken);
                }

                if (minutesToStart <= 0.0 && minutesToStart > -1.0)
                {
                    await TrySendOnceAsync(context, push, appt, "reminder_start", stoppingToken);
                }
            }
        }

        private static async Task TrySendOnceAsync(ApplicationDbContext context, PushNotificationService push, Appointment appt, string type, CancellationToken stoppingToken)
        {
            var alreadyStudent = await context.AppointmentNotificationLogs.AnyAsync(l =>
                l.AppointmentId == appt.Id && l.Type == type && l.UserId == appt.StudentId,
                stoppingToken);

            var alreadyTeacher = await context.AppointmentNotificationLogs.AnyAsync(l =>
                l.AppointmentId == appt.Id && l.Type == type && l.UserId == appt.TeacherId,
                stoppingToken);

            if (alreadyStudent && alreadyTeacher) return;

            var title = "Appointment reminder";
            var whenText = type == "reminder_start" ? "now" : "in 5 minutes";
            var body = $"Your meeting starts {whenText}.";

            if (!alreadyStudent)
            {
                await push.SendToUserAsync(appt.StudentId, new PushPayload(title, body, "/appointment_system/pages/dashboard/student/dashboard.html", $"appt-{type}-{appt.Id}"), stoppingToken);
            }

            if (!alreadyTeacher)
            {
                await push.SendToUserAsync(appt.TeacherId, new PushPayload(title, body, "/appointment_system/pages/dashboard/teacher/dashboard.html", $"appt-{type}-{appt.Id}"), stoppingToken);
            }

            var now = DateTime.Now;
            if (!alreadyStudent)
                context.AppointmentNotificationLogs.Add(new AppointmentNotificationLog { AppointmentId = appt.Id, UserId = appt.StudentId, Type = type, CreatedAt = now });

            if (!alreadyTeacher)
                context.AppointmentNotificationLogs.Add(new AppointmentNotificationLog { AppointmentId = appt.Id, UserId = appt.TeacherId, Type = type, CreatedAt = now });
            await context.SaveChangesAsync(stoppingToken);
        }
    }
}
