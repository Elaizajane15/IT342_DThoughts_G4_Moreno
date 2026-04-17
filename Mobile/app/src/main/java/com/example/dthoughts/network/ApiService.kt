package com.example.dthoughts.network

import com.example.dthoughts.models.AuthResponse
import com.example.dthoughts.models.Comment
import com.example.dthoughts.models.CreateCommentRequest
import com.example.dthoughts.models.CreatePostRequest
import com.example.dthoughts.models.LoginRequest
import com.example.dthoughts.models.Post
import com.example.dthoughts.models.PostResponse
import com.example.dthoughts.models.RegisterRequest
import com.example.dthoughts.models.UpdateUserRequest
import com.example.dthoughts.models.User
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
    @GET("/api/user/me")
    suspend fun getCurrentUser(@Query("email") email: String): Response<User>

    @GET("/api/user/{id}")
    suspend fun getUserById(@Path("id") id: Long): Response<User>

    @GET("/api/user/search")
    suspend fun searchUsers(
        @Query("q") query: String?,
        @Query("limit") limit: Int = 25
    ): Response<List<User>>

    @PUT("/api/user/me")
    suspend fun updateUser(@Body request: UpdateUserRequest): Response<User>

    // Avatar upload
    @Multipart
    @POST("/api/user/me/avatar")
    suspend fun uploadAvatar(
        @Part("email") email: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<User>

    // Cover upload
    @Multipart
    @POST("/api/user/me/cover")
    suspend fun uploadCover(
        @Part("email") email: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<User>

    // Follow endpoints
    @GET("/api/user/{id}/follow")
    suspend fun getFollowStatus(
        @Path("id") id: Long,
        @Query("followerId") followerId: Long?
    ): Response<FollowStatus>

    @POST("/api/user/{id}/follow/toggle")
    suspend fun toggleFollow(
        @Path("id") id: Long,
        @Body request: ToggleFollowRequest
    ): Response<FollowStatus>

    // Post endpoints
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

    // Comment endpoints
    @GET("/api/posts/{postId}/comments")
    suspend fun getComments(@Path("postId") postId: Long): Response<List<Comment>>

    @POST("/api/posts/{postId}/comments")
    suspend fun addComment(
        @Path("postId") postId: Long,
        @Body request: CreateCommentRequest
    ): Response<Comment>
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
