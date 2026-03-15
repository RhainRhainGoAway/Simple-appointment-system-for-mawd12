using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Data;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SchedulesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SchedulesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/schedules/student
        // Returns class schedules for the logged-in student's section
        [HttpGet("student")]
        public async Task<IActionResult> GetStudentClassSchedules()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);

            // Get student's section
            var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (student == null || student.SectionId == null)
                return Ok(new List<object>());

            var schedules = await _context.ClassSchedules
                .Where(cs => cs.SectionId == student.SectionId)
                .Select(cs => new
                {
                    cs.SubjectName,
                    cs.DayOfWeek,
                    startTime = cs.StartTime.ToString("HH:mm:ss"),
                    endTime = cs.EndTime.ToString("HH:mm:ss")
                })
                .ToListAsync();

            return Ok(schedules);
        }

        // GET: api/schedules/teachers
        // Returns list of teachers (for student dashboard sidebar + book-schedule)
        [HttpGet("teachers")]
        public async Task<IActionResult> GetTeachers()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            var teachers = await _context.Users
                .Where(u => u.Role == "teacher")
                .Where(u =>
                    _context.TeacherAvailabilities.Any(a => a.TeacherId == u.Id)
                    || _context.TeacherDateOverrides.Any(o =>
                        o.TeacherId == u.Id
                        && o.SpecificDate >= today
                        && !o.IsClosed
                        && o.StartTime.HasValue
                        && o.EndTime.HasValue
                        && o.EndTime.Value > o.StartTime.Value
                    )
                )
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.ProfilePicture
                })
                .ToListAsync();

            return Ok(teachers);
        }

        // GET: api/schedules/teacher-pending-students
        // Returns students with pending appointments for teacher dashboard sidebar
        [HttpGet("teacher-pending-students")]
        public async Task<IActionResult> GetTeacherPendingStudents()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var teacherId = int.Parse(userIdClaim);

            var students = await _context.Appointments
                .Where(a => a.TeacherId == teacherId && a.Status == "pending")
                .Join(
                    _context.Users,
                    a => a.StudentId,
                    u => u.Id,
                    (a, student) => new
                    {
                        student.Id,
                        student.Name,
                        student.ProfilePicture
                    }
                )
                .Distinct()
                .Take(5)
                .ToListAsync();

            return Ok(students);
        }
    }
}
