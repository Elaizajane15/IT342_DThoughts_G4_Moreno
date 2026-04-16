package com.example.dthoughts.models

data class Comment(
    val id: Long? = null,
    val author: User,
    val content: String,
    val createdAt: String? = null
)

data class CreateCommentRequest(
    val authorEmail: String,
    val content: String
)