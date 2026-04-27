package com.example.dthoughts.models

data class User(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String? = null,
    val bio: String? = null,
    val followerCount: Long? = null,
    val followingCount: Long? = null,
    val totalLikes: Long? = null,
    val totalPosts: Long? = null,
    val coverImageUrl: String? = null,
    val birthDate: String? = null,
    val createdAt: String? = null
)