package com.dthoughts.g4.moreno.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(
		name = "follows",
		uniqueConstraints = { @UniqueConstraint(columnNames = { "follower_id", "following_id" }) }
)
public class Follow {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "follower_id", nullable = false)
	private User follower;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "following_id", nullable = false)
	private User following;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public Follow() {}

	public Follow(User follower, User following) {
		this.follower = follower;
		this.following = following;
	}

	@PrePersist
	public void onCreate() {
		this.createdAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public User getFollower() {
		return follower;
	}

	public void setFollower(User follower) {
		this.follower = follower;
	}

	public User getFollowing() {
		return following;
	}

	public void setFollowing(User following) {
		this.following = following;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
