package com.example.mobile.ui.theme

data class UpdateUserRequest(
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val bio: String?,
    val avatarUrl: String?,
    val coverImageUrl: String?,
    val birthDate: String?
)
