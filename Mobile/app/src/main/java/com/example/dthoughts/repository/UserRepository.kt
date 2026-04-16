package com.example.dthoughts.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.dthoughts.models.*
import com.example.dthoughts.network.ApiService
import com.example.dthoughts.network.RetrofitClient
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class UserRepository(private val context: Context) {

    private val apiService: ApiService = RetrofitClient.apiService
    private val sharedPrefs: SharedPreferences =
        context.getSharedPreferences("UserPrefs", Context.MODE_PRIVATE)

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                authResponse.token?.let { saveToken(it) }
                authResponse.user?.let { saveUserInfo(it) }
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
                saveUserInfo(response.body()!!)
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
            val emailPart = email.toRequestBody(MultipartBody.FORM)
            val filePart = MultipartBody.Part.createFormData(
                "file",
                fileName,
                fileData.toRequestBody(MultipartBody.FORM)
            )
            val response = apiService.uploadAvatar(emailPart, filePart)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Upload failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun saveToken(token: String) {
        sharedPrefs.edit().putString("auth_token", token).apply()
    }

    private fun saveUserInfo(user: User) {
        sharedPrefs.edit().apply {
            putLong("user_id", user.id)
            putString("user_email", user.email)
            putString("user_name", "${user.firstName} ${user.lastName}")
            putBoolean("is_logged_in", true)
            apply()
        }
    }

    fun getAuthToken(): String? = sharedPrefs.getString("auth_token", null)

    fun isLoggedIn(): Boolean = sharedPrefs.getBoolean("is_logged_in", false)

    fun clearSession() {
        sharedPrefs.edit().clear().apply()
    }
}