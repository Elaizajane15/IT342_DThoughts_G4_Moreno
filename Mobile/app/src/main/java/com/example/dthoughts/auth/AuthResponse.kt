package com.example.dthoughts.auth

import com.example.dthoughts.profile.User

data class AuthResponse(
    val token: String?,
    val user: User?
)