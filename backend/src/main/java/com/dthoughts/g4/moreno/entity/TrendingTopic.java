package com.dthoughts.g4.moreno.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "trending_topics")
public class TrendingTopic {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "name", nullable = false, unique = true, length = 120)
	private String name;

	@Column(name = "subtitle", length = 200)
	private String subtitle;

	@Column(name = "rank", nullable = false)
	private int rank;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public TrendingTopic() {}

	public TrendingTopic(String name, String subtitle, int rank) {
		this.name = name;
		this.subtitle = subtitle;
		this.rank = rank;
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

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getSubtitle() {
		return subtitle;
	}

	public void setSubtitle(String subtitle) {
		this.subtitle = subtitle;
	}

	public int getRank() {
		return rank;
	}

	public void setRank(int rank) {
		this.rank = rank;
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

