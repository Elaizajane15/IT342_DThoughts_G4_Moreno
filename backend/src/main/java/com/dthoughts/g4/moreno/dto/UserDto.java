package com.dthoughts.g4.moreno.dto;

public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;

    public UserDto() {}
    public UserDto(Long id, String email, String firstName, String lastName) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public static UserDto fromEntity(com.dthoughts.g4.moreno.entity.User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
