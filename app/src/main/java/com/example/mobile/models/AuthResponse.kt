package com.example.mobile.ui.theme

data class AuthResponse(
    val token: String?,
    val user: User?
)
data class User(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String?,
    val bio: String?,
    val followerCount: Long?,
    val followingCount: Long?,
    val totalLikes: Long?
)