package com.dthoughts.g4.moreno.dto;

import java.time.LocalDateTime;

public class CommentDto {
	private Long id;
	private Long userId;
	private String userName;
	private String userAvatarUrl;
	private String content;
	private LocalDateTime createdAt;

	public CommentDto() {}

	public CommentDto(Long id, Long userId, String userName, String userAvatarUrl, String content, LocalDateTime createdAt) {
		this.id = id;
		this.userId = userId;
		this.userName = userName;
		this.userAvatarUrl = userAvatarUrl;
		this.content = content;
		this.createdAt = createdAt;
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

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
