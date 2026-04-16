package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.PostAdapter
import com.example.dthoughts.databinding.ActivityProfileBinding
import com.example.dthoughts.models.User
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.network.ToggleFollowRequest
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private val postRepository = PostRepository()
    private val apiService = RetrofitClient.apiService
    private var userId: Long = -1
    private var isFollowing: Boolean = false
    private lateinit var postAdapter: PostAdapter

    companion object {
        const val EXTRA_USER_ID = "USER_ID"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userId = intent.getLongExtra(EXTRA_USER_ID, -1)

        setupToolbar()
        setupRecyclerView()
        loadUserProfile()
        
        binding.btnFollow.setOnClickListener {
            toggleFollow()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }

    private fun setupRecyclerView() {
        val currentUser = UserPrefs.getUser()
        postAdapter = PostAdapter(
            emptyList(),
            onLikeClick = { post -> 
                currentUser?.let { user ->
                    lifecycleScope.launch {
                        val result = postRepository.toggleLike(post.id ?: 0, user.email)
                        if (result.isSuccess) {
                            loadUserPosts(userId)
                        }
                    }
                }
            },
            onCommentClick = { /* TODO: Navigate to PostDetails */ },
            onShareClick = { /* TODO: Share intent */ }
        )
        binding.rvUserPosts.layoutManager = LinearLayoutManager(this)
        binding.rvUserPosts.adapter = postAdapter
    }

    private fun loadUserProfile() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = if (userId != -1L) {
                    apiService.getUserById(userId)
                } else {
                    val currentUser = UserPrefs.getUser()
                    if (currentUser != null) {
                        apiService.getCurrentUser(currentUser.email)
                    } else {
                        null
                    }
                }

                if (response?.isSuccessful == true && response.body() != null) {
                    val user = response.body()!!
                    userId = user.id
                    updateUI(user)
                    loadUserPosts(user.id)
                    checkFollowStatus(user.id)
                } else {
                    Toast.makeText(this@ProfileActivity, "Failed to load profile", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun updateUI(user: User) {
        binding.tvFullName.text = "${user.firstName} ${user.lastName}"
        binding.tvEmail.text = "@${user.email.split("@")[0]}"
        binding.tvBio.text = user.bio ?: "No bio yet."
        binding.tvFollowerCount.text = (user.followerCount ?: 0).toString()
        binding.tvFollowingCount.text = (user.followingCount ?: 0).toString()

        val currentUser = UserPrefs.getUser()
        if (currentUser?.id == user.id) {
            binding.btnEditProfile.visibility = View.VISIBLE
            binding.btnFollow.visibility = View.GONE
        } else {
            binding.btnEditProfile.visibility = View.GONE
            binding.btnFollow.visibility = View.VISIBLE
        }
    }

    private fun checkFollowStatus(targetUserId: Long) {
        val currentUser = UserPrefs.getUser() ?: return
        if (currentUser.id == targetUserId) return

        lifecycleScope.launch {
            try {
                val response = apiService.getFollowStatus(targetUserId, currentUser.id)
                if (response.isSuccessful && response.body() != null) {
                    isFollowing = response.body()!!.isFollowing
                    updateFollowButton()
                }
            } catch (e: Exception) {
                // Silent fail
            }
        }
    }

    private fun toggleFollow() {
        val currentUser = UserPrefs.getUser() ?: return
        binding.btnFollow.isEnabled = false
        
        lifecycleScope.launch {
            try {
                val response = apiService.toggleFollow(userId, ToggleFollowRequest(currentUser.id))
                if (response.isSuccessful && response.body() != null) {
                    val status = response.body()!!
                    isFollowing = status.isFollowing
                    binding.tvFollowerCount.text = status.followerCount.toString()
                    updateFollowButton()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Follow action failed", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnFollow.isEnabled = true
            }
        }
    }

    private fun updateFollowButton() {
        binding.btnFollow.text = if (isFollowing) "Unfollow" else "Follow"
    }

    private fun loadUserPosts(userId: Long) {
        lifecycleScope.launch {
            val result = postRepository.getUserPosts(userId)
            if (result.isSuccess) {
                postAdapter.updatePosts(result.getOrDefault(emptyList()))
            }
        }
    }
}
