package com.example.dthoughts.models

data class Comment(
    val id: Long? = null,
    val userId: Long? = null,
    val userName: String? = null,
    val userAvatarUrl: String? = null,
    val content: String,
    val createdAt: String? = null
)

data class CreateCommentRequest(
    val userId: Long,
    val content: String
)
