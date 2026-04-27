package com.example.dthoughts.core

import com.example.dthoughts.post.CreateCommentRequest
import com.example.dthoughts.post.PostResponse
import com.example.dthoughts.post.CreatePostRequest

import com.example.dthoughts.auth.AuthResponse
import com.example.dthoughts.auth.LoginRequest
import com.example.dthoughts.auth.RegisterRequest
import com.example.dthoughts.profile.UpdateUserRequest
import com.example.dthoughts.profile.User
import com.example.dthoughts.post.Post
import com.example.dthoughts.post.Comment
import com.example.dthoughts.notification.Notification

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Auth endpoints
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("/api/auth/forgot-password")
    suspend fun forgotPassword(@Body request: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/auth/reset-password")
    suspend fun resetPassword(@Body request: Map<String, String>): Response<Map<String, Any>>

    // User endpoints
    @GET("/api/users/me")
    suspend fun getCurrentUser(@Query("email") email: String): Response<User>

    @GET("/api/users/{id}")
    suspend fun getUserById(@Path("id") id: Long): Response<User>

    @GET("/api/users/search")
    suspend fun searchUsers(
        @Query("q") query: String?,
        @Query("limit") limit: Int = 25
    ): Response<List<User>>

    @PUT("/api/users/me")
    suspend fun updateUser(@Body request: UpdateUserRequest): Response<User>

    @GET("/api/users/{id}/liked-posts")
    suspend fun getLikedPosts(@Path("id") id: Long): Response<List<Post>>

    @GET("/api/users/{id}/saved-posts")
    suspend fun getSavedPosts(@Path("id") id: Long): Response<List<Post>>

    // Avatar upload
    @Multipart
    @POST("/api/users/me/avatar")
    suspend fun uploadAvatar(
        @Part("email") email: String,
        @Part file: MultipartBody.Part
    ): Response<User>

    // Cover upload
    @Multipart
    @POST("/api/users/me/cover")
    suspend fun uploadCover(
        @Part("email") email: String,
        @Part file: MultipartBody.Part
    ): Response<User>

    // Follow endpoints
    @GET("/api/users/{id}/follow")
    suspend fun getFollowStatus(
        @Path("id") id: Long,
        @Query("followerId") followerId: Long?
    ): Response<FollowStatus>

    @POST("/api/users/{id}/follow/toggle")
    suspend fun toggleFollow(
        @Path("id") id: Long,
        @Body request: ToggleFollowRequest
    ): Response<FollowStatus>

    // Post endpoints
    @GET("/api/posts/{id}")
    suspend fun getPostById(@Path("id") id: Long): Response<Post>

    @GET("/api/posts")
    suspend fun getPosts(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PostResponse>

    @GET("/api/posts/following")
    suspend fun getFollowingPosts(
        @Query("userId") userId: Long,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PostResponse>

    @GET("/api/posts/users/{userId}")
    suspend fun getUserPosts(
        @Path("userId") userId: Long,
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<PostResponse>

    @POST("/api/posts")
    suspend fun createPost(@Body request: CreatePostRequest): Response<Post>

    @Multipart
    @POST("/api/posts/with-image")
    suspend fun createPostWithImage(
        @Part("userId") userId: RequestBody,
        @Part("content") content: RequestBody,
        @Part("mood") mood: RequestBody?,
        @Part file: MultipartBody.Part
    ): Response<Post>

    @POST("/api/posts/{id}/likes/toggle")
    suspend fun toggleLike(
        @Path("id") id: Long,
        @Body request: Map<String, Long>
    ): Response<LikeStatus>

    @DELETE("/api/posts/{id}")
    suspend fun deletePost(@Path("id") id: Long): Response<Unit>

    @PUT("/api/posts/{id}")
    suspend fun updatePost(
        @Path("id") id: Long,
        @Body request: Map<String, String>
    ): Response<Post>

    // Comment endpoints
    @GET("/api/posts/{postId}/comments")
    suspend fun getComments(@Path("postId") postId: Long): Response<List<Comment>>

    @POST("/api/posts/{postId}/comments")
    suspend fun addComment(
        @Path("postId") postId: Long,
        @Body request: CreateCommentRequest
    ): Response<Comment>

    @DELETE("/api/comments/{commentId}")
    suspend fun deleteComment(
        @Path("commentId") commentId: Long,
        @Query("userId") userId: Long
    ): Response<Unit>

    @PUT("/api/comments/{commentId}")
    suspend fun updateComment(
        @Path("commentId") commentId: Long,
        @Body request: CreateCommentRequest
    ): Response<Comment>

    @POST("/api/posts/{id}/saves/toggle")
    suspend fun toggleSave(
        @Path("id") id: Long,
        @Body request: ToggleSaveRequest
    ): Response<SaveStatus>

    // Notification endpoints
    @GET("/api/notifications/user/{userId}")
    suspend fun getNotifications(@Path("userId") userId: Long): Response<List<com.example.dthoughts.notification.Notification>>

    @PUT("/api/notifications/{id}/read")
    suspend fun markNotificationAsRead(@Path("id") id: Long): Response<Unit>

    @PUT("/api/notifications/user/{userId}/read-all")
    suspend fun markAllNotificationsAsRead(@Path("userId") userId: Long): Response<Unit>

    @POST("/api/notifications")
    suspend fun createNotification(@Body notification: com.example.dthoughts.notification.Notification): Response<com.example.dthoughts.notification.Notification>
}

data class LikeStatus(
    val liked: Boolean,
    val likeCount: Long
)

data class FollowStatus(
    val isFollowing: Boolean,
    val followerCount: Long,
    val followingCount: Long
)

data class ToggleFollowRequest(
    val followerId: Long?
)

data class SaveStatus(
    val saved: Boolean,
    val count: Long
)

data class ToggleSaveRequest(
    val userId: Long
)
