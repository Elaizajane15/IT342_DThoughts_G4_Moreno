package com.dthoughts.g4.moreno.dto;

public class LikeStatusDto {
	private boolean liked;
	private long likeCount;

	public LikeStatusDto() {}

	public LikeStatusDto(boolean liked, long likeCount) {
		this.liked = liked;
		this.likeCount = likeCount;
	}

	public boolean isLiked() {
		return liked;
	}

	public void setLiked(boolean liked) {
		this.liked = liked;
	}

	public long getLikeCount() {
		return likeCount;
	}

	public void setLikeCount(long likeCount) {
		this.likeCount = likeCount;
	}
}
