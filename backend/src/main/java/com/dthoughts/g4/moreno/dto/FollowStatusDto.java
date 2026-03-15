package com.dthoughts.g4.moreno.dto;

public class FollowStatusDto {
	private boolean following;
	private long followerCount;
	private long followingCount;

	public FollowStatusDto() {}

	public FollowStatusDto(boolean following, long followerCount, long followingCount) {
		this.following = following;
		this.followerCount = followerCount;
		this.followingCount = followingCount;
	}

	public boolean isFollowing() {
		return following;
	}

	public void setFollowing(boolean following) {
		this.following = following;
	}

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
}
