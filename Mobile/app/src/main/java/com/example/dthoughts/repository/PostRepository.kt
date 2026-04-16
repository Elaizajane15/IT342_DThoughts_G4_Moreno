package com.example.dthoughts.repository

import com.example.dthoughts.models.Comment
import com.example.dthoughts.models.CreateCommentRequest
import com.example.dthoughts.models.CreatePostRequest
import com.example.dthoughts.models.Post
import com.example.dthoughts.network.ApiService
import com.example.dthoughts.network.RetrofitClient

import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class PostRepository(private val apiService: ApiService = RetrofitClient.apiService) {

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

    suspend fun getUserPosts(userId: Long, page: Int = 0): Result<List<Post>> {
        return try {
            val response = apiService.getUserPosts(userId, page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load user posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPost(email: String, content: String, mood: String? = null, imageUrl: String? = null): Result<Post> {
        return try {
            val response = apiService.createPost(CreatePostRequest(email, content, imageUrl, mood))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPostWithImage(email: String, content: String, mood: String?, fileData: ByteArray, fileName: String): Result<Post> {
        return try {
            val emailBody = email.toRequestBody("text/plain".toMediaTypeOrNull())
            val contentBody = content.toRequestBody("text/plain".toMediaTypeOrNull())
            val moodBody = mood?.toRequestBody("text/plain".toMediaTypeOrNull())
            val filePart = MultipartBody.Part.createFormData(
                "file",
                fileName,
                fileData.toRequestBody("image/*".toMediaTypeOrNull())
            )
            
            val response = apiService.createPostWithImage(emailBody, contentBody, moodBody, filePart)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create post with image"))
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

    suspend fun getComments(postId: Long): Result<List<Comment>> {
        return try {
            val response = apiService.getComments(postId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load comments"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun addComment(postId: Long, email: String, content: String): Result<Comment> {
        return try {
            val response = apiService.addComment(postId, CreateCommentRequest(email, content))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to add comment"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}