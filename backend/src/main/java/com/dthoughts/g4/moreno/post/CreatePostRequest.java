package com.dthoughts.g4.moreno.post;

public class CreatePostRequest {
	private Long userId;
	private String content;
	private String mood;

	public CreatePostRequest() {}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getMood() {
		return mood;
	}

	public void setMood(String mood) {
		this.mood = mood;
	}
}

