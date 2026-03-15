package com.dthoughts.g4.moreno.dto;

public class UpdateUserRequest {
    private String email;
    private String firstName;
    private String lastName;
    private String bio;
    private String avatarUrl;
    private String coverImageUrl;
    private String birthDate;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
}
