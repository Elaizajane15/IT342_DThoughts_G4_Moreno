package com.example.dthoughts.models

import java.time.LocalDateTime

data class Post(
    val id: Long? = null,
    val author: User,
    val content: String,
    val imageUrl: String? = null,
    val mood: String? = null,
    val createdAt: String? = null,
    val likeCount: Long = 0,
    val commentCount: Long = 0,
    val isLiked: Boolean = false
)

data class CreatePostRequest(
    val authorEmail: String,
    val content: String,
    val imageUrl: String? = null,
    val mood: String? = null
)