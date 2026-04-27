package com.example.dthoughts.profile

import com.example.dthoughts.auth.AuthResponse
import com.example.dthoughts.auth.LoginRequest
import com.example.dthoughts.auth.RegisterRequest
import com.example.dthoughts.core.ApiService
import com.example.dthoughts.core.RetrofitClient
import com.example.dthoughts.core.UserPrefs

import android.content.Context
import android.content.SharedPreferences
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class UserRepository(private val context: Context) {

    private val apiService: ApiService = RetrofitClient.apiService

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                authResponse.token?.let { UserPrefs.saveToken(it) }
                authResponse.user?.let { UserPrefs.saveUser(it) }
                Result.success(authResponse)
            } else {
                Result.failure(Exception(response.message() ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(email: String, password: String, firstName: String, lastName: String): Result<AuthResponse> {
        return try {
            val response = apiService.register(RegisterRequest(email, password, firstName, lastName))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message() ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCurrentUser(email: String): Result<User> {
        return try {
            val response = apiService.getCurrentUser(email)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateUser(updateRequest: UpdateUserRequest): Result<User> {
        return try {
            val response = apiService.updateUser(updateRequest)
            if (response.isSuccessful && response.body() != null) {
                UserPrefs.saveUser(response.body()!!)
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Update failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadAvatar(email: String, fileData: ByteArray, fileName: String): Result<User> {
        return try {
            val filePart = MultipartBody.Part.createFormData(
                "file",
                fileName,
                fileData.toRequestBody("image/*".toMediaTypeOrNull())
            )
            val response = apiService.uploadAvatar(email, filePart)
            if (response.isSuccessful && response.body() != null) {
                val updatedUser = response.body()!!
                UserPrefs.saveUser(updatedUser)
                Result.success(updatedUser)
            } else {
                Result.failure(Exception("Upload failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun uploadCover(email: String, fileData: ByteArray, fileName: String): Result<User> {
        return try {
            val filePart = MultipartBody.Part.createFormData(
                "file",
                fileName,
                fileData.toRequestBody("image/*".toMediaTypeOrNull())
            )
            val response = apiService.uploadCover(email, filePart)
            if (response.isSuccessful && response.body() != null) {
                val updatedUser = response.body()!!
                UserPrefs.saveUser(updatedUser)
                Result.success(updatedUser)
            } else {
                Result.failure(Exception("Cover upload failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun forgotPassword(email: String): Result<Map<String, Any>> {
        return try {
            val response = apiService.forgotPassword(mapOf("email" to email))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to send reset email"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetPassword(token: String, newPassword: String): Result<Map<String, Any>> {
        return try {
            val response = apiService.resetPassword(mapOf(
                "token" to token,
                "newPassword" to newPassword
            ))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to reset password"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getAuthToken(): String? = UserPrefs.getToken()

    fun isLoggedIn(): Boolean = UserPrefs.isLoggedIn()

    fun clearSession() {
        UserPrefs.clear()
    }
}