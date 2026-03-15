package com.dthoughts.g4.moreno.dto;

public class CreatePostRequest {
	private Long userId;
	private String content;

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
}

