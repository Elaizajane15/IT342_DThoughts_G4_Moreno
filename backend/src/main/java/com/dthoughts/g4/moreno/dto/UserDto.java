package com.dthoughts.g4.moreno.dto;

public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String bio;
    private String avatarUrl;
    private String coverImageUrl;
    private String birthDate;
    private String joinedAt;
    private long followerCount;
    private long followingCount;
    private long totalLikes;

    public UserDto() {}
    public UserDto(Long id, String email, String firstName, String lastName, String bio, String avatarUrl, String coverImageUrl, String birthDate, String joinedAt) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.coverImageUrl = coverImageUrl;
        this.birthDate = birthDate;
        this.joinedAt = joinedAt;
    }

    public UserDto(Long id, String email, String firstName, String lastName, String bio, String avatarUrl, String coverImageUrl, String birthDate, String joinedAt, long followerCount, long followingCount, long totalLikes) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.coverImageUrl = coverImageUrl;
        this.birthDate = birthDate;
        this.joinedAt = joinedAt;
        this.followerCount = followerCount;
        this.followingCount = followingCount;
        this.totalLikes = totalLikes;
    }

    public static UserDto fromEntity(com.dthoughts.g4.moreno.entity.User user) {
        String bd = user.getBirthDate() != null ? user.getBirthDate().toString() : null;
        String ja = user.getCreatedAt() != null ? user.getCreatedAt().toString() : null;
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.getCoverImageUrl(),
                bd,
                ja
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getJoinedAt() { return joinedAt; }
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }

    public long getFollowerCount() {
        return followerCount;
    }

    public void setFollowerCount(long followerCount) {
        this.followerCount = followerCount;
    }

    public long getFollowingCount() {
        return followingCount;
    }

    public void setFollowingCount(long followingCount) {
        this.followingCount = followingCount;
    }

    public long getTotalLikes() {
        return totalLikes;
    }

    public void setTotalLikes(long totalLikes) {
        this.totalLikes = totalLikes;
    }
}
