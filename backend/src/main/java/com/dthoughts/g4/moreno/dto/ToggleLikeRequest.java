package com.dthoughts.g4.moreno.dto;

public class ToggleLikeRequest {
	private Long userId;

	public ToggleLikeRequest() {}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}
}
