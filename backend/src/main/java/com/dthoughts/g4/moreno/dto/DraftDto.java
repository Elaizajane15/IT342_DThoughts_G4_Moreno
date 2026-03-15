package com.dthoughts.g4.moreno.dto;

import java.time.LocalDateTime;

public class DraftDto {
	private Long id;
	private Long userId;
	private String title;
	private String content;
	private String status;
	private String mood;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public DraftDto() {}

	public DraftDto(Long id, Long userId, String title, String content, String status, String mood, LocalDateTime createdAt, LocalDateTime updatedAt) {
		this.id = id;
		this.userId = userId;
		this.title = title;
		this.content = content;
		this.status = status;
		this.mood = mood;
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

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getMood() {
		return mood;
	}

	public void setMood(String mood) {
		this.mood = mood;
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
