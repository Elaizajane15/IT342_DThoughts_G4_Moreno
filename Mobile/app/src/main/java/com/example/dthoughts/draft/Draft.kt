package com.example.dthoughts.draft

data class Draft(
    val id: Long,
    val title: String?,
    val content: String?,
    val mood: String?,
    val savedAt: String
)