using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.DTOs;
using AppointmentSystemAPI.Models;
using AppointmentSystemAPI.Services;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PushNotificationService _push;

        private const int GraceMinutesAfterAppointment = 5;

        public AdminController(ApplicationDbContext context, PushNotificationService push)
        {
            _context = context;
            _push = push;
        }

        // ============================================
        // 1) Students list
        // ============================================
        // GET: api/admin/students
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var rows = await (
                from u in _context.Users
                where u.Role == "student"
                join s in _context.Sections on u.SectionId equals s.Id into sectionJoin
                from s in sectionJoin.DefaultIfEmpty()
                orderby u.Name
                select new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    studentNumber = u.StudentNumber,
                    sectionName = s != null ? s.Name : null,
                    gradeLevel = s != null ? s.GradeLevel : null
                }
            ).ToListAsync();

            return Ok(rows);
        }

        // ============================================
        // 1b) Accounts list (students + teachers)
        // ============================================
        // GET: api/admin/accounts
        [HttpGet("accounts")]
        public async Task<IActionResult> GetAccounts()
        {
            var rows = await (
                from u in _context.Users
                join s in _context.Sections on u.SectionId equals s.Id into sectionJoin
                from s in sectionJoin.DefaultIfEmpty()
                where u.Role == "student" || u.Role == "teacher"
                orderby u.Role, u.Name
                select new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    role = u.Role,
                    studentNumber = u.StudentNumber,
                    sectionName = s != null ? s.Name : null,
                    gradeLevel = s != null ? s.GradeLevel : null
                }
            ).ToListAsync();

            return Ok(rows);
        }

        // ============================================
        // 1c) Create teacher account
        // ============================================
        // POST: api/admin/teachers
        [HttpPost("teachers")]
        public async Task<IActionResult> CreateTeacher([FromBody] AdminCreateTeacherDto model)
        {
            if (model == null)
                return BadRequest(new { message = "Invalid payload." });

            if (string.IsNullOrWhiteSpace(model.Name))
                return BadRequest(new { message = "Name is required." });

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Password is required." });

            const string allowedDomain = "@santarosa.sti.edu.ph";
            if (!model.Email.ToLower().EndsWith(allowedDomain))
            {
                return BadRequest(new { message = "Only @santarosa.sti.edu.ph email addresses are allowed." });
            }

            if (await _context.Users.AnyAsync(s => s.Email == model.Email))
            {
                return BadRequest(new { message = "Email is already registered!" });
            }

            var user = new AppUser
            {
                Name = model.Name.Trim(),
                Email = model.Email.Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = "teacher",
                StudentNumber = null,
                SectionId = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Teacher account created successfully." });
        }

        // ============================================
        // 1d) Reset account password (students + teachers)
        // ============================================
        // PUT: api/admin/accounts/{id}/password
        [HttpPut("accounts/{id}/password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminChangePasswordDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.NewPassword))
                return BadRequest(new { message = "New password is required." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return NotFound(new { message = "Account not found." });

            var role = (user.Role ?? string.Empty).Trim().ToLowerInvariant();
            if (role != "student" && role != "teacher")
            {
                return BadRequest(new { message = "Only student and teacher accounts can be updated." });
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password updated successfully." });
        }

        // ============================================
        // 2) Teachers list + consulted minutes (by week)
        // ============================================
        // Week starts on Monday and counts Mon–Fri only (same as Monitor Schedule)
        // GET: api/admin/teachers?start=2026-04-20
        [HttpGet("teachers")]
        public async Task<IActionResult> GetTeachers([FromQuery] string? start = null)
        {
            DateOnly weekStart;
            DateOnly weekEndExclusive;

            if (string.IsNullOrWhiteSpace(start))
            {
                weekStart = GetActiveWeekStart(DateOnly.FromDateTime(DateTime.Now));
                weekEndExclusive = weekStart.AddDays(5);
            }
            else
            {
                if (!DateOnly.TryParse(start, out weekStart))
                    return BadRequest(new { message = "Invalid start date" });

                weekEndExclusive = weekStart.AddDays(5);
            }

            var teachers = await _context.Users
                .Where(u => u.Role == "teacher")
                .OrderBy(u => u.Name)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.ProfilePicture
                })
                .ToListAsync();

            var accepted = await _context.Appointments
                .Where(a => a.Status == "accepted")
                .Where(a => a.AppointmentDate >= weekStart && a.AppointmentDate < weekEndExclusive)
                .Select(a => new { a.TeacherId, a.AppointmentDate, a.StartTime, a.EndTime })
                .ToListAsync();

            var minutesByTeacher = accepted
                .GroupBy(a => a.TeacherId)
                .ToDictionary(
                    g => g.Key,
                    g => (int)Math.Max(0, Math.Round(g.Sum(x => (x.EndTime.ToTimeSpan() - x.StartTime.ToTimeSpan()).TotalMinutes)))
                );

            var dailyMinutesByTeacher = accepted
                .GroupBy(a => a.TeacherId)
                .ToDictionary(
                    g => g.Key,
                    g => g
                        .GroupBy(x => x.AppointmentDate.DayOfWeek)
                        .ToDictionary(
                            gg => gg.Key,
                            gg => (int)Math.Max(0, Math.Round(gg.Sum(x => (x.EndTime.ToTimeSpan() - x.StartTime.ToTimeSpan()).TotalMinutes)))
                        )
                );

            var result = teachers.Select(t =>
            {
                dailyMinutesByTeacher.TryGetValue(t.Id, out var days);

                return new
                {
                    id = t.Id,
                    name = t.Name,
                    email = t.Email,
                    profilePicture = t.ProfilePicture,
                    weeklyConsultedMinutes = minutesByTeacher.TryGetValue(t.Id, out var mins) ? mins : 0,
                    dailyConsultedMinutes = new
                    {
                        monday = days != null && days.TryGetValue(DayOfWeek.Monday, out var mon) ? mon : 0,
                        tuesday = days != null && days.TryGetValue(DayOfWeek.Tuesday, out var tue) ? tue : 0,
                        wednesday = days != null && days.TryGetValue(DayOfWeek.Wednesday, out var wed) ? wed : 0,
                        thursday = days != null && days.TryGetValue(DayOfWeek.Thursday, out var thu) ? thu : 0,
                        friday = days != null && days.TryGetValue(DayOfWeek.Friday, out var fri) ? fri : 0
                    }
                };
            });

            return Ok(result);
        }

        private static (DateTime weekStart, DateTime weekEndExclusive) GetSundayWeekWindow(DateTime today)
        {
            var d = today.Date;
            var start = d.AddDays(-(int)d.DayOfWeek); // Sunday = 0
            var end = start.AddDays(7);
            return (start, end);
        }

        // ============================================
        // 3) Monitor teacher availability (read-only)
        // ============================================
        // Same format as /api/teacheravailability/week but includes ALL teachers
        // GET: api/admin/teacheravailability/week?start=2025-09-22
        [HttpGet("teacheravailability/week")]
        public async Task<IActionResult> GetWeekAvailability([FromQuery] string start)
        {
            if (!DateOnly.TryParse(start, out var weekStart))
                return BadRequest(new { message = "Invalid start date" });

            var activeWeekStart = GetActiveWeekStart(DateOnly.FromDateTime(DateTime.Now));
            var includeWeeklySchedule = weekStart == activeWeekStart;

            var allAvailability = await _context.TeacherAvailabilities.ToListAsync();
            var weekEnd = weekStart.AddDays(4); // Friday

            var allOverrides = await _context.TeacherDateOverrides
                .Where(o => o.SpecificDate >= weekStart && o.SpecificDate <= weekEnd)
                .ToListAsync();

            var bookedAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate >= weekStart
                    && a.AppointmentDate <= weekEnd
                    && a.Status == "accepted")
                .ToListAsync();

            var teachers = await _context.Users
                .Where(u => u.Role == "teacher")
                .Select(u => new { u.Id, u.Name, u.ProfilePicture })
                .ToListAsync();

            DateTime GetLatestUpdate(int teacherId)
            {
                var latestAvail = allAvailability
                    .Where(a => a.TeacherId == teacherId)
                    .Select(a => a.UpdatedAt)
                    .DefaultIfEmpty(DateTime.MinValue)
                    .Max();

                var latestOverride = allOverrides
                    .Where(o => o.TeacherId == teacherId)
                    .Select(o => o.UpdatedAt)
                    .DefaultIfEmpty(DateTime.MinValue)
                    .Max();

                return latestAvail > latestOverride ? latestAvail : latestOverride;
            }

            teachers = teachers
                .OrderByDescending(t => GetLatestUpdate(t.Id))
                .ThenBy(t => t.Name)
                .ToList();

            string[] dayNames = { "mon", "tue", "wed", "thu", "fri" };

            var result = teachers.Select(teacher =>
            {
                var teacherAvail = allAvailability.Where(a => a.TeacherId == teacher.Id).ToList();
                var teacherOverrides = allOverrides.Where(o => o.TeacherId == teacher.Id).ToList();
                var teacherBookings = bookedAppointments.Where(a => a.TeacherId == teacher.Id).ToList();

                var days = new List<object>();

                for (int i = 0; i < 5; i++)
                {
                    var currentDate = weekStart.AddDays(i);
                    var dayName = dayNames[i];

                    var dayBookings = teacherBookings
                        .Where(a => a.AppointmentDate == currentDate)
                        .Select(a => (start: a.StartTime, end: AddMinutesClamped(a.EndTime, GraceMinutesAfterAppointment)))
                        .OrderBy(b => b.start)
                        .ToList();

                    var dateOverrides = teacherOverrides
                        .Where(o => o.SpecificDate == currentDate)
                        .ToList();

                    if (dateOverrides.Any())
                    {
                        if (dateOverrides.First().IsClosed)
                        {
                            days.Add(new { closed = true, fullyBooked = false, slots = new List<object>() });
                        }
                        else
                        {
                            var rawSlots = dateOverrides
                                .Where(o => o.StartTime.HasValue && o.EndTime.HasValue)
                                .Select(o => (start: o.StartTime!.Value, end: o.EndTime!.Value))
                                .Where(s => s.end > s.start)
                                .OrderBy(s => s.start)
                                .ToList();

                            var availableSlots = new List<(TimeOnly start, TimeOnly end)>();
                            foreach (var slot in rawSlots)
                            {
                                var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                                availableSlots.AddRange(remaining
                                    .Where(r => r.end > r.start));
                            }

                            var sortedSlots = availableSlots
                                .OrderBy(s => s.start)
                                .Select(r => new
                                {
                                    startTime = r.start.ToString("h:mm tt"),
                                    endTime = r.end.ToString("h:mm tt")
                                })
                                .ToList();

                            var fullyBooked = rawSlots.Count > 0 && sortedSlots.Count == 0;
                            var closed = rawSlots.Count == 0;
                            days.Add(new { closed, fullyBooked, slots = sortedSlots });
                        }
                    }
                    else
                    {
                        var rawSlots = includeWeeklySchedule
                            ? teacherAvail
                                .Where(a => a.DayOfWeek == dayName)
                                .Select(a => (start: a.StartTime, end: a.EndTime))
                                .Where(s => s.end > s.start)
                                .OrderBy(s => s.start)
                                .ToList()
                            : new List<(TimeOnly start, TimeOnly end)>();

                        var availableSlots = new List<(TimeOnly start, TimeOnly end)>();
                        foreach (var slot in rawSlots)
                        {
                            var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                            availableSlots.AddRange(remaining
                                .Where(r => r.end > r.start));
                        }

                        var sortedSlots = availableSlots
                            .OrderBy(s => s.start)
                            .Select(r => new
                            {
                                startTime = r.start.ToString("h:mm tt"),
                                endTime = r.end.ToString("h:mm tt")
                            })
                            .ToList();

                        var fullyBooked = rawSlots.Count > 0 && sortedSlots.Count == 0;
                        var closed = rawSlots.Count == 0;
                        days.Add(new { closed, fullyBooked, slots = sortedSlots });
                    }
                }

                return new
                {
                    teacherId = teacher.Id,
                    teacherName = teacher.Name,
                    teacherProfilePicture = teacher.ProfilePicture,
                    schedule = days
                };
            }).ToList();

            return Ok(result);
        }

        private static TimeOnly AddMinutesClamped(TimeOnly time, int minutes)
        {
            if (minutes == 0) return time;

            var added = time.Add(TimeSpan.FromMinutes(minutes));

            // TimeOnly.Add wraps around past midnight; clamp instead.
            if (minutes > 0 && added < time) return new TimeOnly(23, 59);
            if (minutes < 0 && added > time) return new TimeOnly(0, 0);

            return added;
        }

        private static DateOnly GetActiveWeekStart(DateOnly today)
        {
            var dow = today.DayOfWeek;

            if (dow == DayOfWeek.Saturday) return today.AddDays(2);
            if (dow == DayOfWeek.Sunday) return today.AddDays(1);
            if (dow == DayOfWeek.Friday) return today.AddDays(3);

            var daysSinceMonday = ((int)dow - (int)DayOfWeek.Monday);
            return today.AddDays(-daysSinceMonday);
        }

        private static List<(TimeOnly start, TimeOnly end)> SubtractBookedSlots(
            TimeOnly slotStart, TimeOnly slotEnd,
            List<(TimeOnly start, TimeOnly end)> bookedSlots)
        {
            var available = new List<(TimeOnly start, TimeOnly end)> { (slotStart, slotEnd) };

            foreach (var booked in bookedSlots.OrderBy(b => b.start))
            {
                var newAvailable = new List<(TimeOnly start, TimeOnly end)>();
                foreach (var slot in available)
                {
                    if (booked.end <= slot.start || booked.start >= slot.end)
                    {
                        newAvailable.Add(slot);
                    }
                    else
                    {
                        if (booked.start > slot.start)
                            newAvailable.Add((slot.start, booked.start));
                        if (booked.end < slot.end)
                            newAvailable.Add((booked.end, slot.end));
                    }
                }
                available = newAvailable;
            }

            return available;
        }

        // ============================================
        // 4) Combined appointments (pending + history)
        // ============================================
        // GET: api/admin/appointments
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var rows = await (
                from a in _context.Appointments
                join st in _context.Users on a.StudentId equals st.Id
                join te in _context.Users on a.TeacherId equals te.Id
                join sec in _context.Sections on st.SectionId equals sec.Id into secJoin
                from sec in secJoin.DefaultIfEmpty()
                orderby a.AppointmentDate descending, a.StartTime descending
                select new
                {
                    id = a.Id,
                    status = a.Status,
                    appointmentDate = a.AppointmentDate.ToString("dd-MMM-yyyy"),
                    startTime = a.StartTime.ToString("h:mm tt"),
                    endTime = a.EndTime.ToString("h:mm tt"),
                    reason = a.Reason,
                    notes = a.Notes,
                    location = a.Location,
                    studentName = st.Name,
                    studentEmail = st.Email,
                    sectionName = sec != null ? sec.Name : null,
                    gradeLevel = sec != null ? sec.GradeLevel : null,
                    teacherName = te.Name,
                    teacherEmail = te.Email
                }
            ).Take(500).ToListAsync();

            return Ok(rows);
        }

        // ============================================
        // 5) Cancel an accepted meeting
        // ============================================
        // PUT: api/admin/appointments/{id}/cancel
        [HttpPut("appointments/{id}/cancel")]
        public async Task<IActionResult> CancelAcceptedAppointment(int id)
        {
            var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null)
                return NotFound(new { message = "Appointment not found" });

            if (appointment.Status == "cancelled")
                return BadRequest(new { message = "Appointment is already cancelled" });

            if (appointment.Status != "accepted")
                return BadRequest(new { message = "Only accepted meetings can be cancelled" });

            appointment.Status = "cancelled";
            appointment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            try
            {
                await _push.SendToUserAsync(
                    appointment.StudentId,
                    new PushPayload(
                        "Appointment cancelled",
                        "An accepted meeting was cancelled.",
                        "/appointment_system/pages/dashboard/student/dashboard.html",
                        $"appointment-cancelled-{appointment.Id}"),
                    HttpContext.RequestAborted);

                await _push.SendToUserAsync(
                    appointment.TeacherId,
                    new PushPayload(
                        "Appointment cancelled",
                        "An accepted meeting was cancelled.",
                        "/appointment_system/pages/dashboard/teacher/dashboard.html",
                        $"appointment-cancelled-{appointment.Id}"),
                    HttpContext.RequestAborted);
            }
            catch
            {
                // best-effort
            }

            return Ok(new { message = "Appointment cancelled successfully" });
        }
    }
}
