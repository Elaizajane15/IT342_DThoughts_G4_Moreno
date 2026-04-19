package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityGuestFeedBinding
import com.example.dthoughts.models.Post
import kotlinx.coroutines.launch

class GuestFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityGuestFeedBinding
    private val postRepository = com.example.dthoughts.repository.PostRepository()
    private val allPosts = mutableListOf<Post>()
    private lateinit var postAdapter: com.example.dthoughts.adapters.PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGuestFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        setupRecyclerView()
        loadPosts()
    }

    private fun setupRecyclerView() {
        postAdapter = com.example.dthoughts.adapters.PostAdapter(
            posts = allPosts,
            isLoggedIn = false,
            onLikeClick = { showLoginPrompt() },
            onCommentClick = { showLoginPrompt() },
            onShareClick = { post -> sharePost(post) },
            onPostClick = { showLoginPrompt() },
            onUserClick = { showLoginPrompt() }
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

    private fun sharePost(post: Post) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "${post.userName ?: "Someone"} shared on DThoughts: ${post.content}")
            type = "text/plain"
        }
        startActivity(Intent.createChooser(shareIntent, "Share post via"))
    }
}