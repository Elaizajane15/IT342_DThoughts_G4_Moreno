package com.example.dthoughts.notification

import com.example.dthoughts.core.ApiService
import com.example.dthoughts.core.RetrofitClient


class NotificationRepository(private val apiService: ApiService = RetrofitClient.apiService) {

    suspend fun getNotifications(userId: Long): Result<List<Notification>> {
        return try {
            val response = apiService.getNotifications(userId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load notifications: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAsRead(notificationId: Long): Result<Unit> {
        return try {
            val response = apiService.markNotificationAsRead(notificationId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark as read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun markAllAsRead(userId: Long): Result<Unit> {
        return try {
            val response = apiService.markAllNotificationsAsRead(userId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to mark all as read"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
