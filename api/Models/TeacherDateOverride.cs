using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("teacher_date_overrides")]
    public class TeacherDateOverride
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("teacher_id")]
        public int TeacherId { get; set; }

        [Column("specific_date")]
        public DateOnly SpecificDate { get; set; }

        [Column("is_closed")]
        public bool IsClosed { get; set; } = false;

        [Column("start_time")]
        public TimeOnly? StartTime { get; set; }

        [Column("end_time")]
        public TimeOnly? EndTime { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("TeacherId")]
        public AppUser? Teacher { get; set; }
    }
}
