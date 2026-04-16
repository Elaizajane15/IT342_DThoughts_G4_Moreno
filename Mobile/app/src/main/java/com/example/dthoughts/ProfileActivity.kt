package com.example.dthoughts

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
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import kotlinx.coroutines.launch

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private val postRepository = PostRepository()
    private val apiService = RetrofitClient.apiService
    private var userId: Long = -1
    private var userEmail: String? = null
    private lateinit var postAdapter: PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userId = intent.getLongExtra("user_id", -1)
        userEmail = intent.getStringExtra("user_email")

        setupToolbar()
        setupRecyclerView()
        loadUserProfile()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }

    private fun setupRecyclerView() {
        postAdapter = PostAdapter(
            emptyList(),
            onLikeClick = { /* TODO */ },
            onCommentClick = { /* TODO */ },
            onShareClick = { /* TODO */ }
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
                } else if (userEmail != null) {
                    apiService.getCurrentUser(userEmail!!)
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
                    updateUI(user)
                    loadUserPosts(user.email)
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
            // TODO: Check follow status and update button text
        }
    }

    private fun loadUserPosts(email: String) {
        lifecycleScope.launch {
            // Need a getPostsByUser endpoint or filter existing getPosts
            // For now, let's assume we might need a new endpoint in ApiService
            // Or use getPosts and filter (not efficient but works for now)
            val result = postRepository.getPosts()
            if (result.isSuccess) {
                val allPosts = result.getOrDefault(emptyList())
                val userPosts = allPosts.filter { it.author.email == email }
                postAdapter.updatePosts(userPosts)
            }
        }
    }
}