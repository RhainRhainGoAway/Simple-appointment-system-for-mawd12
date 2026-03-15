using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("appointments")]
    public class Appointment
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("student_id")]
        public int StudentId { get; set; }

        [Column("teacher_id")]
        public int TeacherId { get; set; }

        [Column("appointment_date")]
        public DateOnly AppointmentDate { get; set; }

        [Column("start_time")]
        public TimeOnly StartTime { get; set; }

        [Column("end_time")]
        public TimeOnly EndTime { get; set; }

        [Column("status")]
        public string Status { get; set; } = "pending";

        [Column("reason")]
        public string? Reason { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("location")]
        public string? Location { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("StudentId")]
        public AppUser? Student { get; set; }

        [ForeignKey("TeacherId")]
        public AppUser? Teacher { get; set; }
    }
}
