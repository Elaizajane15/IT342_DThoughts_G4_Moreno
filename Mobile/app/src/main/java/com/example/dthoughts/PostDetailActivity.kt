package com.example.dthoughts

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.CommentAdapter
import com.example.dthoughts.databinding.ActivityPostDetailBinding
import com.example.dthoughts.models.Post
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import com.google.gson.Gson
import kotlinx.coroutines.launch

class PostDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPostDetailBinding
    private val postRepository = PostRepository(RetrofitClient.apiService)
    private lateinit var commentAdapter: CommentAdapter
    private var post: Post? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPostDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val postJson = intent.getStringExtra("POST_JSON")
        post = Gson().fromJson(postJson, Post::class.java)

        if (post == null) {
            finish()
            return
        }

        setupUI()
        loadComments()
    }

    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        // Populate post content
        val postItem = post!!
        with(binding.postContent) {
            tvUserName.text = "${postItem.author.firstName} ${postItem.author.lastName}"
            tvUsername.text = "@${postItem.author.email.split("@")[0]}"
            tvPostContent.text = postItem.content
            tvLikeCount.text = postItem.likeCount.toString()
            tvCommentCount.text = postItem.commentCount.toString()
            tvAvatarInitial.text = postItem.author.firstName.take(1).uppercase()
            
            ivLike.alpha = if (postItem.isLiked) 1.0f else 0.6f
            ivLike.setColorFilter(if (postItem.isLiked) android.graphics.Color.RED else android.graphics.Color.GRAY)

            llLike.setOnClickListener { toggleLike() }
            // Share in detail activity too
            llShare.setOnClickListener { sharePost() }
        }

        // Setup comments recycler
        commentAdapter = CommentAdapter(emptyList())
        binding.rvComments.layoutManager = LinearLayoutManager(this)
        binding.rvComments.adapter = commentAdapter

        binding.btnSendComment.setOnClickListener {
            val content = binding.etComment.text.toString().trim()
            if (content.isNotEmpty()) {
                addComment(content)
            }
        }
    }

    private fun loadComments() {
        binding.commentProgress.visibility = View.VISIBLE
        lifecycleScope.launch {
            val result = postRepository.getComments(post!!.id!!)
            binding.commentProgress.visibility = View.GONE
            if (result.isSuccess) {
                commentAdapter.updateComments(result.getOrDefault(emptyList()))
            }
        }
    }

    private fun addComment(content: String) {
        val user = UserPrefs.getUser()
        if (user == null) {
            Toast.makeText(this, "Login to comment", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnSendComment.isEnabled = false
        lifecycleScope.launch {
            val result = postRepository.addComment(post!!.id!!, user.email, content)
            binding.btnSendComment.isEnabled = true
            if (result.isSuccess) {
                binding.etComment.text.clear()
                loadComments()
                // Update local post comment count
                post = post!!.copy(commentCount = post!!.commentCount + 1)
                binding.postContent.tvCommentCount.text = post!!.commentCount.toString()
            } else {
                Toast.makeText(this@PostDetailActivity, "Failed to add comment", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun toggleLike() {
        val user = UserPrefs.getUser()
        if (user == null) {
            Toast.makeText(this, "Login to like posts", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            val result = postRepository.toggleLike(post!!.id!!, user.email)
            if (result.isSuccess) {
                post = result.getOrNull()
                post?.let {
                    binding.postContent.tvLikeCount.text = it.likeCount.toString()
                    binding.postContent.ivLike.alpha = if (it.isLiked) 1.0f else 0.6f
                    binding.postContent.ivLike.setColorFilter(if (it.isLiked) android.graphics.Color.RED else android.graphics.Color.GRAY)
                }
            }
        }
    }
    
    private fun sharePost() {
        val shareIntent = android.content.Intent().apply {
            action = android.content.Intent.ACTION_SEND
            putExtra(android.content.Intent.EXTRA_TEXT, "${post?.author?.firstName} shared on DThoughts: ${post?.content}")
            type = "text/plain"
        }
        startActivity(android.content.Intent.createChooser(shareIntent, "Share post via"))
    }
}