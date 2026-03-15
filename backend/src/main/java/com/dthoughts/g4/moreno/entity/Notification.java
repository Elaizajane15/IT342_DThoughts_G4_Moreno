package com.dthoughts.g4.moreno.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "recipient_id", nullable = false)
	private User recipient;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "actor_id")
	private User actor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	private Post post;

	@Column(name = "type", nullable = false, length = 30)
	private String type;

	@Column(name = "message", length = 300)
	private String message;

	@Column(name = "is_read", nullable = false)
	private boolean read;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public Notification() {}

	public Notification(User recipient, User actor, Post post, String type, String message) {
		this.recipient = recipient;
		this.actor = actor;
		this.post = post;
		this.type = type;
		this.message = message;
		this.read = false;
	}

	@PrePersist
	public void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	public void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public User getRecipient() {
		return recipient;
	}

	public void setRecipient(User recipient) {
		this.recipient = recipient;
	}

	public User getActor() {
		return actor;
	}

	public void setActor(User actor) {
		this.actor = actor;
	}

	public Post getPost() {
		return post;
	}

	public void setPost(Post post) {
		this.post = post;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public boolean isRead() {
		return read;
	}

	public void setRead(boolean read) {
		this.read = read;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}

