using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("class_schedules")]
    public class ClassSchedule
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("section_id")]
        public int SectionId { get; set; }

        [Column("subject")]
        public string SubjectName { get; set; } = string.Empty;

        [Column("day_of_week")]
        public string DayOfWeek { get; set; } = string.Empty; // mon, tue, wed, thu, fri

        [Column("start_time")]
        public TimeOnly StartTime { get; set; }

        [Column("end_time")]
        public TimeOnly EndTime { get; set; }

        [ForeignKey("SectionId")]
        public Section? Section { get; set; }
    }
}
