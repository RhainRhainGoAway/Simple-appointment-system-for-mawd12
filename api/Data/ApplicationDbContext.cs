using Microsoft.EntityFrameworkCore;
using AppointmentSystemAPI.Models;

namespace AppointmentSystemAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<AppUser> Users { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<TeacherAvailability> TeacherAvailabilities { get; set; }
        public DbSet<TeacherDateOverride> TeacherDateOverrides { get; set; }
        public DbSet<ClassSchedule> ClassSchedules { get; set; }
    }
}
