package com.example.dthoughts.post

import com.example.dthoughts.R

import com.example.dthoughts.auth.LoginActivity
import com.example.dthoughts.auth.RegisterActivity
import com.example.dthoughts.profile.ProfileActivity

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityGuestFeedBinding
import kotlinx.coroutines.launch

class GuestFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGuestFeedBinding
    private val postRepository = PostRepository()
    private val allPosts = mutableListOf<Post>()
    private lateinit var postAdapter: PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGuestFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        setupRecyclerView()
        loadPosts()
    }

    private fun setupRecyclerView() {
        postAdapter = PostAdapter(
            posts = allPosts,
            isLoggedIn = false,
            onLikeClick = { showLoginPrompt() },
            onCommentClick = { post -> openPostDetail(post) },
            onShareClick = { post -> sharePost(post) },
            onPostClick = { post -> openPostDetail(post) },
            onUserClick = { post ->
                post.userId?.let { uid ->
                    val intent = Intent(this@GuestFeedActivity, ProfileActivity::class.java)
                    intent.putExtra(ProfileActivity.EXTRA_USER_ID, uid.toLong())
                    startActivity(intent)
                } ?: showLoginPrompt()
            }
        )
        binding.rvPosts.layoutManager = androidx.recyclerview.widget.LinearLayoutManager(this)
        binding.rvPosts.adapter = postAdapter
    }

    private fun setupListeners() {
        binding.btnLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        binding.btnSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }
    }

    private fun loadPosts() {
        lifecycleScope.launch {
            val result = postRepository.getPosts(0)
            if (result.isSuccess) {
                val posts = result.getOrDefault(emptyList())
                allPosts.clear()
                allPosts.addAll(posts)
                postAdapter.updatePosts(allPosts)
                
                if (allPosts.isEmpty()) {
                    binding.emptyState.root.visibility = View.VISIBLE
                } else {
                    binding.emptyState.root.visibility = View.GONE
                }
            } else {
                Toast.makeText(this@GuestFeedActivity, "Failed to load posts", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showLoginPrompt() {
        Toast.makeText(this, getString(R.string.login_prompt), Toast.LENGTH_SHORT).show()
        startActivity(Intent(this, LoginActivity::class.java))
    }

    private fun openPostDetail(post: Post) {
        val intent = Intent(this, PostDetailActivity::class.java)
        intent.putExtra("POST_JSON", com.google.gson.Gson().toJson(post))
        startActivity(intent)
    }

    private fun sharePost(post: Post) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "${post.userName ?: "Someone"} shared on DThoughts: ${post.content}")
            type = "text/plain"
        }
        startActivity(Intent.createChooser(shareIntent, "Share post via"))
    }
}