using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Data;
using AppointmentSystemAPI.Models;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TeacherAvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private const int GraceMinutesAfterAppointment = 5;

        public TeacherAvailabilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        private static DateTime GetManilaNow()
        {
            // We standardize schedule week-assignment to Asia/Manila.
            // Timezone IDs differ by OS; try common ones.
            var nowUtc = DateTime.UtcNow;
            string[] tzIds = { "Asia/Manila", "Philippine Standard Time", "Singapore Standard Time" };

            foreach (var tzId in tzIds)
            {
                try
                {
                    var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                    return TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);
                }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            // Fallback: server local clock.
            return DateTime.Now;
        }

        private static DateOnly GetWeekStartMonday(DateOnly date)
        {
            var dow = date.DayOfWeek;
            var daysSinceMonday = ((int)dow - (int)DayOfWeek.Monday);
            if (daysSinceMonday < 0) daysSinceMonday += 7; // Sunday => 6
            return date.AddDays(-daysSinceMonday);
        }

        private static int DayOfWeekOffset(string dayOfWeek)
        {
            return (dayOfWeek ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "mon" => 0,
                "tue" => 1,
                "wed" => 2,
                "thu" => 3,
                "fri" => 4,
                _ => -1
            };
        }

        private static DateOnly ComputeEffectiveWeekStart(DateTime createdAtManila, string dayOfWeek, TimeOnly slotStart)
        {
            // Weekly availability is NOT recurring forever.
            // Each saved weekly slot is assigned to exactly ONE week:
            // - Normally: the week containing the save timestamp
            // - If saved on weekend: next week only
            // - If the slot's first occurrence in that base week is already past at save time: push to next week

            var createdAtDate = DateOnly.FromDateTime(createdAtManila);
            var createdDow = createdAtManila.DayOfWeek;

            var baseWeekStart = GetWeekStartMonday(createdAtDate);

            // Weekend saves target next week.
            if (createdDow == DayOfWeek.Saturday || createdDow == DayOfWeek.Sunday)
                baseWeekStart = baseWeekStart.AddDays(7);

            var offset = DayOfWeekOffset(dayOfWeek);
            if (offset < 0) return baseWeekStart; // Unknown day; best-effort.

            var slotDateInBaseWeek = baseWeekStart.AddDays(offset);
            var slotDateTimeInBaseWeek = slotDateInBaseWeek.ToDateTime(slotStart);

            // If the slot start is not strictly in the future at save-time, push it to next week.
            if (slotDateTimeInBaseWeek <= createdAtManila)
                return baseWeekStart.AddDays(7);

            return baseWeekStart;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return claim != null ? int.Parse(claim) : 0;
        }

        private static DateOnly GetActiveWeekStart(DateOnly today) => GetWeekStartMonday(today);

        private static bool IsSlotInFuture(DateOnly slotDate, TimeOnly slotStart, DateOnly today, TimeOnly now)
        {
            if (slotDate != today) return true;
            // For "today", only allow slots that haven't started yet.
            return slotStart > now;
        }

        // GET: api/teacheravailability/my
        // Get the current teacher's own schedule (for edit-schedule page)
        [HttpGet("my")]
        public async Task<IActionResult> GetMySchedule()
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var weekly = await _context.TeacherAvailabilities
                .Where(ta => ta.TeacherId == teacherId)
                .Select(ta => new
                {
                    ta.DayOfWeek,
                    startTime = ta.StartTime.ToString("hh:mm"),
                    startPeriod = ta.StartTime.Hour >= 12 ? "PM" : "AM",
                    endTime = ta.EndTime.ToString("hh:mm"),
                    endPeriod = ta.EndTime.Hour >= 12 ? "PM" : "AM",
                    ta.IsPreferred
                })
                .ToListAsync();

            var overrides = await _context.TeacherDateOverrides
                .Where(o => o.TeacherId == teacherId)
                .Select(o => new
                {
                    date = o.SpecificDate.ToString("yyyy-MM-dd"),
                    o.IsClosed,
                    startTime = o.StartTime.HasValue ? o.StartTime.Value.ToString("hh:mm") : null,
                    startPeriod = o.StartTime.HasValue ? (o.StartTime.Value.Hour >= 12 ? "PM" : "AM") : null,
                    endTime = o.EndTime.HasValue ? o.EndTime.Value.ToString("hh:mm") : null,
                    endPeriod = o.EndTime.HasValue ? (o.EndTime.Value.Hour >= 12 ? "PM" : "AM") : null
                })
                .ToListAsync();

            // Group weekly by day
            var weeklyGrouped = weekly.GroupBy(w => w.DayOfWeek).ToDictionary(
                g => g.Key,
                g => new
                {
                    enabled = true,
                    slots = g.Select(s => new
                    {
                        s.startTime,
                        s.startPeriod,
                        s.endTime,
                        s.endPeriod,
                        isPreferred = s.IsPreferred
                    }).ToList()
                }
            );

            return Ok(new { weekly = weeklyGrouped, specificDates = overrides });
        }

        // POST: api/teacheravailability/save
        // Save the teacher's full schedule (weekly + date-specific)
        [HttpPost("save")]
        public async Task<IActionResult> SaveSchedule([FromBody] SaveScheduleDto dto)
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var manilaNow = GetManilaNow();

            // Remove old availability
            var oldAvailability = await _context.TeacherAvailabilities
                .Where(ta => ta.TeacherId == teacherId).ToListAsync();
            _context.TeacherAvailabilities.RemoveRange(oldAvailability);

            var oldOverrides = await _context.TeacherDateOverrides
                .Where(o => o.TeacherId == teacherId).ToListAsync();
            _context.TeacherDateOverrides.RemoveRange(oldOverrides);

            // Save weekly slots
            if (dto.Weekly != null)
            {
                foreach (var (day, dayData) in dto.Weekly)
                {
                    if (!dayData.Enabled || dayData.Slots == null) continue;

                    foreach (var slot in dayData.Slots)
                    {
                        var startTime = ParseTime(slot.StartTime, slot.StartPeriod);
                        var endTime = ParseTime(slot.EndTime, slot.EndPeriod);
                        if (startTime == null || endTime == null) continue;

                        _context.TeacherAvailabilities.Add(new TeacherAvailability
                        {
                            TeacherId = teacherId,
                            DayOfWeek = day,
                            StartTime = startTime.Value,
                            EndTime = endTime.Value,
                            IsPreferred = slot.IsPreferred,
                            CreatedAt = manilaNow,
                            UpdatedAt = manilaNow
                        });
                    }
                }
            }

            // Save date-specific overrides
            if (dto.SpecificDates != null)
            {
                foreach (var sd in dto.SpecificDates)
                {
                    if (!DateOnly.TryParse(sd.Date, out var specificDate)) continue;

                    if (sd.IsClosed)
                    {
                        _context.TeacherDateOverrides.Add(new TeacherDateOverride
                        {
                            TeacherId = teacherId,
                            SpecificDate = specificDate,
                            IsClosed = true,
                            CreatedAt = manilaNow,
                            UpdatedAt = manilaNow
                        });
                    }
                    else if (sd.Slots != null)
                    {
                        foreach (var slot in sd.Slots)
                        {
                            var startTime = ParseTime(slot.StartTime, slot.StartPeriod);
                            var endTime = ParseTime(slot.EndTime, slot.EndPeriod);
                            if (startTime == null || endTime == null) continue;

                            _context.TeacherDateOverrides.Add(new TeacherDateOverride
                            {
                                TeacherId = teacherId,
                                SpecificDate = specificDate,
                                IsClosed = false,
                                StartTime = startTime.Value,
                                EndTime = endTime.Value,
                                CreatedAt = manilaNow,
                                UpdatedAt = manilaNow
                            });
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Schedule saved successfully" });
        }

        // GET: api/teacheravailability/week?start=2025-09-22
        // Get all teachers' availability for a given week (for book-schedule page)
        [HttpGet("week")]
        public async Task<IActionResult> GetWeekAvailability([FromQuery] string start)
        {
            if (!DateOnly.TryParse(start, out var weekStart))
                return BadRequest(new { message = "Invalid start date" });

            // Weekly schedule applies to exactly ONE computed week per saved slot.
            // Past-time filtering for "today" is based on Asia/Manila.
            var manilaNow = GetManilaNow();
            var today = DateOnly.FromDateTime(manilaNow);
            var now = TimeOnly.FromDateTime(manilaNow);

            // Get all teachers with their availability
            var teachers = await _context.Users
                .Where(u => u.Role == "teacher")
                .Select(u => new { u.Id, u.Name, u.ProfilePicture })
                .ToListAsync();

            var allAvailability = await _context.TeacherAvailabilities.ToListAsync();
            var weekEnd = weekStart.AddDays(4); // Friday
            var allOverrides = await _context.TeacherDateOverrides
                .Where(o => o.SpecificDate >= weekStart && o.SpecificDate <= weekEnd)
                .ToListAsync();

            // Only subtract ACCEPTED bookings — multiple pending bookings on the same slot are allowed
            var bookedAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate >= weekStart
                    && a.AppointmentDate <= weekEnd
                    && a.Status == "accepted")
                .ToListAsync();

            var result = teachers.Select(teacher =>
            {
                var teacherAvail = allAvailability.Where(a => a.TeacherId == teacher.Id).ToList();
                var teacherOverrides = allOverrides.Where(o => o.TeacherId == teacher.Id).ToList();
                var teacherBookings = bookedAppointments.Where(a => a.TeacherId == teacher.Id).ToList();

                // Build 5-day schedule (Mon-Fri)
                var days = new List<DayAvailabilityDto>();
                string[] dayNames = { "mon", "tue", "wed", "thu", "fri" };

                for (int i = 0; i < 5; i++)
                {
                    var currentDate = weekStart.AddDays(i);
                    var dayName = dayNames[i];

                    // Get booked slots for this teacher on this date
                    var dayBookings = teacherBookings
                        .Where(a => a.AppointmentDate == currentDate)
                        .Select(a => (start: a.StartTime, end: AddMinutesClamped(a.EndTime, GraceMinutesAfterAppointment)))
                        .ToList();

                    // Check for date-specific override first
                    var dateOverrides = teacherOverrides
                        .Where(o => o.SpecificDate == currentDate).ToList();

                    if (dateOverrides.Any())
                    {
                        if (dateOverrides.First().IsClosed)
                        {
                            days.Add(new DayAvailabilityDto { Closed = true, FullyBooked = false, Slots = new List<SlotDto>() });
                        }
                        else
                        {
                            var rawSlots = dateOverrides
                                .Where(o => o.StartTime.HasValue && o.EndTime.HasValue)
                                .Select(o => (start: o.StartTime!.Value, end: o.EndTime!.Value))
                                .Where(s => s.end > s.start)
                                .ToList();

                            // If it's today and all slots have already started, treat as closed.
                            if (currentDate == today && rawSlots.Count > 0 && !rawSlots.Any(s => s.start > now))
                            {
                                days.Add(new DayAvailabilityDto { Closed = true, FullyBooked = false, Slots = new List<SlotDto>() });
                                continue;
                            }

                            // Subtract booked slots
                            var availableSlots = new List<SlotDto>();
                            foreach (var slot in rawSlots)
                            {
                                var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                                availableSlots.AddRange(remaining
                                    .Where(r => r.end > r.start)
                                    .Where(r => IsSlotInFuture(currentDate, r.start, today, now))
                                    .Select(r => new SlotDto
                                    {
                                        StartTime = r.start.ToString("h:mm tt"),
                                        EndTime = r.end.ToString("h:mm tt")
                                    }));
                            }

                            var fullyBooked = rawSlots.Count > 0 && availableSlots.Count == 0;
                            var closed = rawSlots.Count == 0;
                            days.Add(new DayAvailabilityDto { Closed = closed, FullyBooked = fullyBooked, Slots = availableSlots });
                        }
                    }
                    else
                    {
                        // Weekly schedule: include only slots whose effective week equals the requested week.
                        var rawSlots = teacherAvail
                            .Where(a => a.DayOfWeek == dayName)
                            .Where(a => ComputeEffectiveWeekStart(a.CreatedAt, a.DayOfWeek, a.StartTime) == weekStart)
                            .Select(a => (start: a.StartTime, end: a.EndTime))
                            .Where(s => s.end > s.start)
                            .ToList();

                        // If it's today and all slots have already started, treat as closed.
                        if (currentDate == today && rawSlots.Count > 0 && !rawSlots.Any(s => s.start > now))
                        {
                            days.Add(new DayAvailabilityDto { Closed = true, FullyBooked = false, Slots = new List<SlotDto>() });
                            continue;
                        }

                        // Subtract booked slots
                        var availableSlots = new List<SlotDto>();
                        foreach (var slot in rawSlots)
                        {
                            var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                            availableSlots.AddRange(remaining
                                .Where(r => r.end > r.start)
                                .Where(r => IsSlotInFuture(currentDate, r.start, today, now))
                                .Select(r => new SlotDto
                                {
                                    StartTime = r.start.ToString("h:mm tt"),
                                    EndTime = r.end.ToString("h:mm tt")
                                }));
                        }

                        var fullyBooked = rawSlots.Count > 0 && availableSlots.Count == 0;
                        var closed = rawSlots.Count == 0;
                        days.Add(new DayAvailabilityDto { Closed = closed, FullyBooked = fullyBooked, Slots = availableSlots });
                    }
                }

                return new
                {
                    teacherId = teacher.Id,
                    teacherName = teacher.Name,
                    teacherProfilePicture = teacher.ProfilePicture,
                    schedule = days
                };
            })
            .Where(t => t.schedule.Any(d => !d.Closed && d.Slots.Count > 0))
            .ToList();

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

        /// <summary>
        /// Subtracts booked time ranges from an availability slot,
        /// returning the remaining available time ranges.
        /// </summary>
        private List<(TimeOnly start, TimeOnly end)> SubtractBookedSlots(
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
                        // No overlap
                        newAvailable.Add(slot);
                    }
                    else
                    {
                        // Overlap - split into before and after
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

        private TimeOnly? ParseTime(string? timeStr, string? period)
        {
            if (string.IsNullOrEmpty(timeStr) || timeStr == "00:00" && period == "AM") return null;

            var parts = timeStr.Split(':');
            if (parts.Length != 2) return null;
            if (!int.TryParse(parts[0], out var hour) || !int.TryParse(parts[1], out var minute)) return null;

            if (period?.ToUpper() == "PM" && hour != 12) hour += 12;
            if (period?.ToUpper() == "AM" && hour == 12) hour = 0;

            return new TimeOnly(hour, minute);
        }

        private sealed class DayAvailabilityDto
        {
            public bool Closed { get; set; }
            public bool FullyBooked { get; set; }
            public List<SlotDto> Slots { get; set; } = new();
        }

        private sealed class SlotDto
        {
            public string StartTime { get; set; } = string.Empty;
            public string EndTime { get; set; } = string.Empty;
        }
    }

    // DTOs
    public class SaveScheduleDto
    {
        public Dictionary<string, WeeklyDayDto>? Weekly { get; set; }
        public List<SpecificDateDto>? SpecificDates { get; set; }
    }

    public class WeeklyDayDto
    {
        public bool Enabled { get; set; }
        public List<TimeSlotDto>? Slots { get; set; }
    }

    public class TimeSlotDto
    {
        public string StartTime { get; set; } = string.Empty;
        public string StartPeriod { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string EndPeriod { get; set; } = string.Empty;
        public bool IsPreferred { get; set; }
    }

    public class SpecificDateDto
    {
        public string Date { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public List<TimeSlotDto>? Slots { get; set; }
    }
}
