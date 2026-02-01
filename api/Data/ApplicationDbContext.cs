using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Models;

namespace AppointmentSystemAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Student> Students { get; set; }
        public DbSet<Section> Sections { get; set; }
    }
}
