using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Data;

namespace AppointmentSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SectionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SectionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/sections
        [HttpGet]
        public async Task<IActionResult> GetAllSections()
        {
            var sections = await _context.Sections
                .OrderBy(s => s.GradeLevel)
                .ThenBy(s => s.Name)
                .ToListAsync();

            return Ok(sections);
        }

        // GET: api/sections/by-grade/{gradeLevel}
        [HttpGet("by-grade/{gradeLevel}")]
        public async Task<IActionResult> GetSectionsByGrade(string gradeLevel)
        {
            // Decode URL encoding (e.g., "Grade%2011" -> "Grade 11")
            gradeLevel = Uri.UnescapeDataString(gradeLevel);
            
            var sections = await _context.Sections
                .Where(s => s.GradeLevel == gradeLevel)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sections);
        }
    }
}
