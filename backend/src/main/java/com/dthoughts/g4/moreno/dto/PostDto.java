package com.dthoughts.g4.moreno.dto;

import java.time.LocalDateTime;

public class PostDto {
	private Long id;
	private Long userId;
	private String userName;
	private String userAvatarUrl;
	private String content;
	private String imagePath;
	private long likeCount;
	private long commentCount;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public PostDto() {}

	public PostDto(Long id, Long userId, String userName, String userAvatarUrl, String content, String imagePath, long likeCount, long commentCount, LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.id = id;
		this.userId = userId;
		this.userName = userName;
		this.userAvatarUrl = userAvatarUrl;
		this.content = content;
		this.imagePath = imagePath;
		this.likeCount = likeCount;
		this.commentCount = commentCount;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserAvatarUrl() {
		return userAvatarUrl;
	}

	public void setUserAvatarUrl(String userAvatarUrl) {
		this.userAvatarUrl = userAvatarUrl;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getImagePath() {
		return imagePath;
	}

	public void setImagePath(String imagePath) {
		this.imagePath = imagePath;
	}

	public long getLikeCount() {
		return likeCount;
	}

	public void setLikeCount(long likeCount) {
		this.likeCount = likeCount;
	}

	public long getCommentCount() {
		return commentCount;
	}

	public void setCommentCount(long commentCount) {
		this.commentCount = commentCount;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
}
