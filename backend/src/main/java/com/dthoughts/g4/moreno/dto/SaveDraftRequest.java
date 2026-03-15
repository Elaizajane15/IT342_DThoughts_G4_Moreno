package com.dthoughts.g4.moreno.dto;

public class SaveDraftRequest {
	private Long userId;
	private String title;
	private String content;
	private String status;
	private String mood;

	public SaveDraftRequest() {}

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
}
