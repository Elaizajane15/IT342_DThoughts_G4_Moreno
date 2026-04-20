package com.example.dthoughts.models

import com.google.gson.annotations.SerializedName

data class Notification(
    val id: Long = 0,
    val type: String = "",
    val actorId: Long? = null,
    val actorName: String? = "",
    @SerializedName("actorAvatar")
    val actorAvatarUrl: String? = null,
    @SerializedName("refPostId")
    val targetId: Long? = null,
    val message: String? = null,
    @SerializedName("postPreview")
    val previewText: String? = null,
    val createdAt: String = "",
    @SerializedName("read")
    var isRead: Boolean = false
)