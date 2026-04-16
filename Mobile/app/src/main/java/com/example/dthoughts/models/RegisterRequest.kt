package com.example.dthoughts.models

data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String
)