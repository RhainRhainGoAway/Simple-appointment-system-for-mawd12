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

        public TeacherAvailabilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return claim != null ? int.Parse(claim) : 0;
        }

        private static DateOnly GetActiveWeekStart(DateOnly today)
        {
            // Active week is the week we allow booking for.
            // Mon-Thu => current week's Monday
            // Fri/Sat/Sun => next week's Monday
            var dow = today.DayOfWeek;

            if (dow == DayOfWeek.Saturday) return today.AddDays(2);
            if (dow == DayOfWeek.Sunday) return today.AddDays(1);
            if (dow == DayOfWeek.Friday) return today.AddDays(3);

            // Monday = 1 ... Thursday = 4
            var daysSinceMonday = ((int)dow - (int)DayOfWeek.Monday);
            return today.AddDays(-daysSinceMonday);
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
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
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
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
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
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
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

            // Weekly schedule (day-of-week) should only apply to the current "active" week,
            // otherwise it repeats forever.
            // Date-specific overrides are allowed for any requested week.
            var activeWeekStart = GetActiveWeekStart(DateOnly.FromDateTime(DateTime.Now));
            var includeWeeklySchedule = weekStart == activeWeekStart;

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
                        .Select(a => (start: a.StartTime, end: a.EndTime))
                        .ToList();

                    // Check for date-specific override first
                    var dateOverrides = teacherOverrides
                        .Where(o => o.SpecificDate == currentDate).ToList();

                    if (dateOverrides.Any())
                    {
                        if (dateOverrides.First().IsClosed)
                        {
                            days.Add(new DayAvailabilityDto { Closed = true, Slots = new List<SlotDto>() });
                        }
                        else
                        {
                            var rawSlots = dateOverrides
                                .Where(o => o.StartTime.HasValue && o.EndTime.HasValue)
                                .Select(o => (start: o.StartTime!.Value, end: o.EndTime!.Value))
                                .Where(s => s.end > s.start)
                                .ToList();

                            // Subtract booked slots
                            var availableSlots = new List<SlotDto>();
                            foreach (var slot in rawSlots)
                            {
                                var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                                availableSlots.AddRange(remaining
                                    .Where(r => r.end > r.start)
                                    .Select(r => new SlotDto
                                    {
                                        StartTime = r.start.ToString("h:mm tt"),
                                        EndTime = r.end.ToString("h:mm tt")
                                    }));
                            }

                            days.Add(new DayAvailabilityDto { Closed = availableSlots.Count == 0, Slots = availableSlots });
                        }
                    }
                    else
                    {
                        // Use weekly schedule only for the active week
                        var rawSlots = includeWeeklySchedule
                            ? teacherAvail
                                .Where(a => a.DayOfWeek == dayName)
                                .Select(a => (start: a.StartTime, end: a.EndTime))
                                .Where(s => s.end > s.start)
                                .ToList()
                            : new List<(TimeOnly start, TimeOnly end)>();

                        // Subtract booked slots
                        var availableSlots = new List<SlotDto>();
                        foreach (var slot in rawSlots)
                        {
                            var remaining = SubtractBookedSlots(slot.start, slot.end, dayBookings);
                            availableSlots.AddRange(remaining
                                .Where(r => r.end > r.start)
                                .Select(r => new SlotDto
                                {
                                    StartTime = r.start.ToString("h:mm tt"),
                                    EndTime = r.end.ToString("h:mm tt")
                                }));
                        }

                        days.Add(new DayAvailabilityDto { Closed = availableSlots.Count == 0, Slots = availableSlots });
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
