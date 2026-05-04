using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("appointment_notification_log")]
    public class AppointmentNotificationLog
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("appointment_id")]
        public int AppointmentId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        // e.g. requested, accepted, declined, cancelled, reminder_5min, reminder_start
        [Column("type")]
        public string Type { get; set; } = string.Empty;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
