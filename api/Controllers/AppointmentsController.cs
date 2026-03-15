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
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppointmentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return claim != null ? int.Parse(claim) : 0;
        }

        // ============================================
        // Student Endpoints
        // ============================================

        // GET: api/appointments/student/stats
        [HttpGet("student/stats")]
        public async Task<IActionResult> GetStudentStats()
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            var pending = await _context.Appointments.CountAsync(a => a.StudentId == studentId && a.Status == "pending");
            var accepted = await _context.Appointments.CountAsync(a => a.StudentId == studentId && a.Status == "accepted");
            var cancelled = await _context.Appointments.CountAsync(a => a.StudentId == studentId && a.Status == "cancelled");

            return Ok(new { pending, accepted, cancelled });
        }

        // GET: api/appointments/student/all
        [HttpGet("student/all")]
        public async Task<IActionResult> GetStudentAllRequests()
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            var appointments = await _context.Appointments
                .Where(a => a.StudentId == studentId)
                .Join(
                    _context.Users,
                    a => a.TeacherId,
                    u => u.Id,
                    (a, teacher) => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        a.Reason,
                        a.Notes,
                        a.CreatedAt,
                        TeacherName = teacher.Name,
                        TeacherEmail = teacher.Email
                    }
                )
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.StartTime)
                .ToListAsync();

            var result = appointments.Select(a => new
            {
                a.Id,
                appointmentDate = a.AppointmentDate.ToString("dd-MMM-yyyy"),
                startTime = a.StartTime.ToString("h:mm tt"),
                endTime = a.EndTime.ToString("h:mm tt"),
                status = a.Status,
                reason = a.Reason,
                notes = a.Notes,
                createdAt = a.CreatedAt.ToString("dd-MMM-yyyy"),
                teacherName = a.TeacherName,
                teacherEmail = a.TeacherEmail
            });

            return Ok(result);
        }

        // GET: api/appointments/student/history
        // Returns accepted appointments (past consultations)
        [HttpGet("student/history")]
        public async Task<IActionResult> GetStudentHistory()
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            var history = await _context.Appointments
                .Where(a => a.StudentId == studentId && a.Status == "accepted")
                .Join(
                    _context.Users,
                    a => a.TeacherId,
                    u => u.Id,
                    (a, teacher) => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        TeacherName = teacher.Name,
                        TeacherProfilePicture = teacher.ProfilePicture
                    }
                )
                .OrderByDescending(a => a.AppointmentDate)
                .Take(10)
                .ToListAsync();

            var result = history.Select(a => new
            {
                a.Id,
                teacherName = a.TeacherName,
                teacherProfilePicture = a.TeacherProfilePicture,
                appointmentDate = a.AppointmentDate.ToString("MMMM dd, yyyy"),
                startTime = a.StartTime.ToString("h:mm tt"),
                endTime = a.EndTime.ToString("h:mm tt")
            });

            return Ok(result);
        }

        // GET: api/appointments/student/consultations
        // Returns accepted and pending appointments as calendar events
        [HttpGet("student/consultations")]
        public async Task<IActionResult> GetStudentConsultations()
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            var consultations = await _context.Appointments
                .Where(a => a.StudentId == studentId && (a.Status == "accepted" || a.Status == "pending"))
                .Join(
                    _context.Users,
                    a => a.TeacherId,
                    u => u.Id,
                    (a, teacher) => new
                    {
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        a.Reason,
                        a.Notes,
                        a.Location,
                        TeacherName = teacher.Name,
                        TeacherEmail = teacher.Email,
                        TeacherProfilePicture = teacher.ProfilePicture
                    }
                )
                .ToListAsync();

            var result = consultations.Select(a => new
            {
                title = a.TeacherName,
                start = a.AppointmentDate.ToDateTime(a.StartTime).ToString("yyyy-MM-ddTHH:mm:ss"),
                end = a.AppointmentDate.ToDateTime(a.EndTime).ToString("yyyy-MM-ddTHH:mm:ss"),
                type = "consultation",
                status = a.Status,
                reason = a.Reason ?? "",
                notes = a.Notes ?? "",
                location = a.Location ?? "Faculty",
                personName = a.TeacherName,
                personEmail = a.TeacherEmail,
                personProfilePicture = a.TeacherProfilePicture ?? ""
            });

            return Ok(result);
        }

        // DELETE: api/appointments/{id}/cancel
        [HttpDelete("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.StudentId == studentId);

            if (appointment == null)
                return NotFound(new { message = "Appointment not found" });

            if (appointment.Status != "pending")
                return BadRequest(new { message = "Only pending appointments can be cancelled" });

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment cancelled successfully" });
        }

        // POST: api/appointments
        // Create a new appointment (student books a consultation)
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var studentId = GetUserId();
            if (studentId == 0) return Unauthorized();

            if (dto == null)
                return BadRequest(new { message = "Invalid request" });

            // Verify teacher exists
            var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId && u.Role == "teacher");
            if (teacher == null)
                return BadRequest(new { message = "Teacher not found" });

            var appointmentDate = DateOnly.Parse(dto.AppointmentDate);
            var startTime = TimeOnly.Parse(dto.StartTime);
            var endTime = TimeOnly.Parse(dto.EndTime);

            if (endTime <= startTime)
                return BadRequest(new { message = "End time must be after start time" });

            // Prevent booking a consultation during the student's class schedule.
            // Do not rely on exact role string casing/format; SectionId is the source of truth.
            var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == studentId);
            if (student?.SectionId is int sectionId)
            {
                var dayCode = appointmentDate.DayOfWeek switch
                {
                    DayOfWeek.Monday => "mon",
                    DayOfWeek.Tuesday => "tue",
                    DayOfWeek.Wednesday => "wed",
                    DayOfWeek.Thursday => "thu",
                    DayOfWeek.Friday => "fri",
                    DayOfWeek.Saturday => "sat",
                    DayOfWeek.Sunday => "sun",
                    _ => ""
                };

                // Class schedules are recurring weekly, keyed by section + day_of_week.
                var hasClassConflict = await _context.ClassSchedules.AnyAsync(s =>
                    s.SectionId == sectionId
                    && (s.DayOfWeek ?? "").Trim().ToLower() == dayCode
                    && s.StartTime < endTime
                    && s.EndTime > startTime
                );

                if (hasClassConflict)
                    return BadRequest(new { message = "You cannot book when you have a class at that time." });
            }

            // Check for overlapping ACCEPTED appointments only — multiple pending bookings are allowed
            var hasConflict = await _context.Appointments.AnyAsync(a =>
                a.TeacherId == dto.TeacherId
                && a.AppointmentDate == appointmentDate
                && a.Status == "accepted"
                && a.StartTime < endTime
                && a.EndTime > startTime
            );

            if (hasConflict)
                return BadRequest(new { message = "This time slot is no longer available. Please choose another." });

            var appointment = new Appointment
            {
                StudentId = studentId,
                TeacherId = dto.TeacherId,
                AppointmentDate = appointmentDate,
                StartTime = startTime,
                EndTime = endTime,
                Status = "pending",
                Reason = dto.Reason,
                Notes = dto.Notes,
                Location = dto.Location ?? "Faculty",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment created successfully", id = appointment.Id });
        }

        // ============================================
        // Teacher Endpoints
        // ============================================

        // GET: api/appointments/teacher/stats
        [HttpGet("teacher/stats")]
        public async Task<IActionResult> GetTeacherStats()
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var pending = await _context.Appointments.CountAsync(a => a.TeacherId == teacherId && a.Status == "pending");
            var accepted = await _context.Appointments.CountAsync(a => a.TeacherId == teacherId && a.Status == "accepted");
            var cancelled = await _context.Appointments.CountAsync(a => a.TeacherId == teacherId && a.Status == "cancelled");

            return Ok(new { pending, accepted, cancelled });
        }

        // GET: api/appointments/teacher/pending
        [HttpGet("teacher/pending")]
        public async Task<IActionResult> GetTeacherPendingRequests()
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var appointments = await _context.Appointments
                .Where(a => a.TeacherId == teacherId && a.Status == "pending")
                .Join(
                    _context.Users,
                    a => a.StudentId,
                    u => u.Id,
                    (a, student) => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        a.Reason,
                        a.Notes,
                        a.CreatedAt,
                        StudentName = student.Name,
                        StudentEmail = student.Email,
                        student.SectionId
                    }
                )
                .GroupJoin(
                    _context.Sections,
                    a => a.SectionId,
                    s => s.Id,
                    (a, sections) => new { a, sections }
                )
                .SelectMany(
                    x => x.sections.DefaultIfEmpty(),
                    (x, section) => new
                    {
                        x.a.Id,
                        x.a.AppointmentDate,
                        x.a.StartTime,
                        x.a.EndTime,
                        x.a.Status,
                        x.a.Reason,
                        x.a.Notes,
                        x.a.CreatedAt,
                        x.a.StudentName,
                        x.a.StudentEmail,
                        SectionName = section != null ? section.Name : "N/A"
                    }
                )
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.StartTime)
                .ToListAsync();

            var result = appointments.Select(a =>
            {
                var nameParts = a.StudentName.Split(' ', 2);
                return new
                {
                    a.Id,
                    firstName = nameParts[0],
                    lastName = nameParts.Length > 1 ? nameParts[1] : "",
                    sectionName = a.SectionName,
                    appointmentDate = a.AppointmentDate.ToString("dd-MMM-yyyy"),
                    startTime = a.StartTime.ToString("h:mm tt"),
                    endTime = a.EndTime.ToString("h:mm tt"),
                    status = a.Status,
                    reason = a.Reason,
                    notes = a.Notes,
                    createdAt = a.CreatedAt.ToString("dd-MMM-yyyy"),
                    studentEmail = a.StudentEmail
                };
            });

            return Ok(result);
        }

        // GET: api/appointments/teacher/history
        [HttpGet("teacher/history")]
        public async Task<IActionResult> GetTeacherHistory()
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var history = await _context.Appointments
                .Where(a => a.TeacherId == teacherId && a.Status == "accepted")
                .Join(
                    _context.Users,
                    a => a.StudentId,
                    u => u.Id,
                    (a, student) => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        StudentName = student.Name,
                        StudentProfilePicture = student.ProfilePicture
                    }
                )
                .OrderByDescending(a => a.AppointmentDate)
                .Take(10)
                .ToListAsync();

            var result = history.Select(a => new
            {
                a.Id,
                studentName = a.StudentName,
                studentProfilePicture = a.StudentProfilePicture,
                appointmentDate = a.AppointmentDate.ToString("MMMM dd, yyyy"),
                startTime = a.StartTime.ToString("h:mm tt"),
                endTime = a.EndTime.ToString("h:mm tt")
            });

            return Ok(result);
        }

        // GET: api/appointments/teacher/consultations
        [HttpGet("teacher/consultations")]
        public async Task<IActionResult> GetTeacherConsultations()
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var consultations = await _context.Appointments
                .Where(a => a.TeacherId == teacherId && a.Status == "accepted")
                .Join(
                    _context.Users,
                    a => a.StudentId,
                    u => u.Id,
                    (a, student) => new
                    {
                        a.AppointmentDate,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        a.Reason,
                        a.Notes,
                        a.Location,
                        StudentName = student.Name,
                        StudentEmail = student.Email,
                        StudentProfilePicture = student.ProfilePicture
                    }
                )
                .ToListAsync();

            var result = consultations.Select(a => new
            {
                title = a.StudentName,
                start = a.AppointmentDate.ToDateTime(a.StartTime).ToString("yyyy-MM-ddTHH:mm:ss"),
                end = a.AppointmentDate.ToDateTime(a.EndTime).ToString("yyyy-MM-ddTHH:mm:ss"),
                type = "consultation",
                status = a.Status,
                reason = a.Reason ?? "",
                notes = a.Notes ?? "",
                location = a.Location ?? "Faculty",
                personName = a.StudentName,
                personEmail = a.StudentEmail,
                personProfilePicture = a.StudentProfilePicture ?? ""
            });

            return Ok(result);
        }

        // PUT: api/appointments/{id}/accept
        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptAppointment(int id)
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == teacherId);

            if (appointment == null)
                return NotFound(new { message = "Appointment not found" });

            if (appointment.Status != "pending")
                return BadRequest(new { message = "Only pending appointments can be accepted" });

            appointment.Status = "accepted";
            appointment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment accepted" });
        }

        // PUT: api/appointments/{id}/decline
        [HttpPut("{id}/decline")]
        public async Task<IActionResult> DeclineAppointment(int id)
        {
            var teacherId = GetUserId();
            if (teacherId == 0) return Unauthorized();

            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == teacherId);

            if (appointment == null)
                return NotFound(new { message = "Appointment not found" });

            if (appointment.Status != "pending")
                return BadRequest(new { message = "Only pending appointments can be declined" });

            appointment.Status = "cancelled";
            appointment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment declined" });
        }

        // GET: api/appointments/booked-slots
        // Returns booked time slots for a specific teacher on a specific date
        [HttpGet("booked-slots")]
        public async Task<IActionResult> GetBookedSlots([FromQuery] int teacherId, [FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var appointmentDate))
                return BadRequest(new { message = "Invalid date format" });

            var bookedSlots = await _context.Appointments
                .Where(a => a.TeacherId == teacherId
                    && a.AppointmentDate == appointmentDate
                    && a.Status == "accepted")
                .Select(a => new
                {
                    startTime = a.StartTime.ToString("h:mm tt"),
                    endTime = a.EndTime.ToString("h:mm tt")
                })
                .ToListAsync();

            return Ok(bookedSlots);
        }
    }

    // DTO for creating appointments
    public class CreateAppointmentDto
    {
        public int TeacherId { get; set; }
        public string AppointmentDate { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string? Notes { get; set; }
        public string? Location { get; set; }
    }
}
