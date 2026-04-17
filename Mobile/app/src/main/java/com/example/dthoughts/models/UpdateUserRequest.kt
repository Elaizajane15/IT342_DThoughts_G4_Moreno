package com.example.dthoughts.models

data class UpdateUserRequest(
    val email: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val coverImageUrl: String? = null,
    val birthDate: String? = null
)
