using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("push_subscriptions")]
    public class UserPushSubscription
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("endpoint")]
        public string Endpoint { get; set; } = string.Empty;

        [Column("p256dh")]
        public string P256dh { get; set; } = string.Empty;

        [Column("auth")]
        public string Auth { get; set; } = string.Empty;

        [Column("user_agent")]
        public string? UserAgent { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
