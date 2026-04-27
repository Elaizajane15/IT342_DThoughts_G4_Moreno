package com.example.dthoughts.post

import com.example.dthoughts.core.SaveStatus
import com.example.dthoughts.core.ToggleSaveRequest

import com.example.dthoughts.core.LikeStatus

import com.example.dthoughts.core.ApiService
import com.example.dthoughts.core.RetrofitClient


import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class PostRepository(private val apiService: ApiService = RetrofitClient.apiService) {

    suspend fun getPosts(page: Int = 0): Result<List<Post>> {
        return try {
            val response = apiService.getPosts(page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.content)
            } else {
                Result.failure(Exception("Failed to load posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFollowingPosts(userId: Long, page: Int = 0): Result<List<Post>> {
        return try {
            val response = apiService.getFollowingPosts(userId, page)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.content)
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
                Result.success(response.body()!!.content)
            } else {
                Result.failure(Exception("Failed to load user posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPost(userId: Long, content: String, mood: String? = null): Result<Post> {
        return try {
            val response = apiService.createPost(CreatePostRequest(userId, content, mood))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPostWithImage(userId: Long, content: String, mood: String?, fileData: ByteArray, fileName: String): Result<Post> {
        return try {
            val userIdBody = userId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val contentBody = content.toRequestBody("text/plain".toMediaTypeOrNull())
            val moodBody = mood?.toRequestBody("text/plain".toMediaTypeOrNull())
            val filePart = MultipartBody.Part.createFormData(
                "file",
                fileName,
                fileData.toRequestBody("image/*".toMediaTypeOrNull())
            )
            
            val response = apiService.createPostWithImage(userIdBody, contentBody, moodBody, filePart)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create post with image"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleLike(postId: Long, userId: Long): Result<LikeStatus> {
        return try {
            val response = apiService.toggleLike(postId, mapOf("userId" to userId))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to like post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleSave(postId: Long, userId: Long): Result<com.example.dthoughts.core.SaveStatus> {
        return try {
            val response = apiService.toggleSave(postId, com.example.dthoughts.core.ToggleSaveRequest(userId))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to save post"))
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

    suspend fun addComment(postId: Long, userId: Long, content: String): Result<Comment> {
        return try {
            val response = apiService.addComment(postId, CreateCommentRequest(userId, content))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to add comment"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePost(postId: Long): Result<Unit> {
        return try {
            val response = apiService.deletePost(postId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePost(postId: Long, content: String): Result<Post> {
        return try {
            val response = apiService.updatePost(postId, mapOf("content" to content))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update post"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLikedPosts(userId: Long): Result<List<Post>> {
        return try {
            val response = apiService.getLikedPosts(userId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load liked posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSavedPosts(userId: Long): Result<List<Post>> {
        return try {
            val response = apiService.getSavedPosts(userId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load saved posts"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

