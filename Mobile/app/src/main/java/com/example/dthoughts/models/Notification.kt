package com.example.dthoughts.models

data class Notification(
    val id: Long,
    val type: String, // LIKE, COMMENT, FOLLOW, POST
    val actorId: Long,
    val actorName: String,
    val actorAvatarUrl: String?,
    val targetId: Long?, // Post ID or User ID
    val previewText: String?,
    val createdAt: String,
    var isRead: Boolean = false
)