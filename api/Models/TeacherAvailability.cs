using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("teacher_availability")]
    public class TeacherAvailability
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("teacher_id")]
        public int TeacherId { get; set; }

        [Column("day_of_week")]
        public string DayOfWeek { get; set; } = string.Empty; // mon, tue, wed, thu, fri, sat

        [Column("start_time")]
        public TimeOnly StartTime { get; set; }

        [Column("end_time")]
        public TimeOnly EndTime { get; set; }

        [Column("is_preferred")]
        public bool IsPreferred { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("TeacherId")]
        public AppUser? Teacher { get; set; }
    }
}
