using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystemAPI.Models
{
    [Table("students")]  // Match your existing MySQL table name
    public class Student
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Column("password")]
        public string Password { get; set; } = string.Empty;

        [Column("role")]
        public string Role { get; set; } = string.Empty;

        [Column("student_number")]
        public string? StudentNumber { get; set; }

        [Column("profile_picture")]
        public string? ProfilePicture { get; set; }

        [Column("section_id")]
        public int? SectionId { get; set; }
    }
}
