package com.example.dthoughts.repository

import com.example.dthoughts.models.CreatePostRequest
import com.example.dthoughts.models.Post
import com.example.dthoughts.network.ApiService
import com.example.dthoughts.network.RetrofitClient
import retrofit2.Response

class PostRepository {

    private val apiService: ApiService = RetrofitClient.apiService

    suspend fun getPosts(page: Int = 0): Result<List<Post>> {
        return try {
            val response = apiService.getPosts(page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFollowingPosts(email: String, page: Int = 0): Result<List<Post>> {
        return try {
            val response = apiService.getFollowingPosts(email, page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load following posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPost(email: String, content: String, imageUrl: String? = null): Result<Post> {
        return try {
            val response = apiService.createPost(CreatePostRequest(email, content, imageUrl))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleLike(postId: Long, email: String): Result<Post> {
        return try {
            val response = apiService.toggleLike(postId, email)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to like post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}