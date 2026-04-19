package com.example.dthoughts.models

data class Post(
    val id: Long? = null,
    val userId: Long? = null,
    val userName: String? = null,
    val userAvatarUrl: String? = null,
    val content: String,
    val mood: String? = null,
    val imagePath: String? = null,
    val likeCount: Long = 0,
    val commentCount: Long = 0,
    val isLiked: Boolean = false,
    val isSaved: Boolean = false,
    val saveCount: Long = 0,
    val createdAt: String? = null
)

data class PostResponse(
    val content: List<Post>,
    val totalPages: Int,
    val totalElements: Long,
    val page: Int,
    val size: Int
)

data class CreatePostRequest(
    val userId: Long,
    val content: String,
    val mood: String? = null
)
