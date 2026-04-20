package com.example.dthoughts.repository

import com.example.dthoughts.models.Notification
import com.example.dthoughts.network.ApiService
import com.example.dthoughts.network.RetrofitClient

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
