package com.dthoughts.g4.moreno.dto;

import java.time.LocalDateTime;

public class NotificationDto {
	private Long id;
	private String type;
	private boolean read;
	private String actorName;
	private String actorAvatar;
	private String message;
	private String postPreview;
	private Long refPostId;
	private LocalDateTime createdAt;

	public NotificationDto() {}

	public NotificationDto(
			Long id,
			String type,
			boolean read,
			String actorName,
			String actorAvatar,
			String message,
			String postPreview,
			Long refPostId,
			LocalDateTime createdAt
	) {
		this.id = id;
		this.type = type;
		this.read = read;
		this.actorName = actorName;
		this.actorAvatar = actorAvatar;
		this.message = message;
		this.postPreview = postPreview;
		this.refPostId = refPostId;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public boolean isRead() {
		return read;
	}

	public void setRead(boolean read) {
		this.read = read;
	}

	public String getActorName() {
		return actorName;
	}

	public void setActorName(String actorName) {
		this.actorName = actorName;
	}

	public String getActorAvatar() {
		return actorAvatar;
	}

	public void setActorAvatar(String actorAvatar) {
		this.actorAvatar = actorAvatar;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public String getPostPreview() {
		return postPreview;
	}

	public void setPostPreview(String postPreview) {
		this.postPreview = postPreview;
	}

	public Long getRefPostId() {
		return refPostId;
	}

	public void setRefPostId(Long refPostId) {
		this.refPostId = refPostId;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}

