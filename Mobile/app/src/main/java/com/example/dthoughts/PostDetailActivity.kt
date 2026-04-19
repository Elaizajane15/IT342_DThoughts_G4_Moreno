package com.example.dthoughts

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
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
            tvUserName.text = postItem.userName ?: "Anonymous"
            tvUsername.text = "@${postItem.userName?.lowercase()?.replace(" ", "") ?: "unknown"}"
            tvPostContent.text = postItem.content
            tvLikeCount.text = postItem.likeCount.toString()
            tvCommentCount.text = postItem.commentCount.toString()
            
            val currentUser = UserPrefs.getUser()
            val isAuthor = currentUser != null && currentUser.id == postItem.userId
            
            btnMorePost.visibility = if (isAuthor) View.VISIBLE else View.GONE
            btnMorePost.setOnClickListener { view ->
                val popup = androidx.appcompat.widget.PopupMenu(this@PostDetailActivity, view)
                popup.menu.add("Edit")
                popup.menu.add("Delete")
                popup.setOnMenuItemClickListener { menuItem ->
                    when (menuItem.title) {
                        "Edit" -> {
                            showEditPostDialog(postItem)
                            true
                        }
                        "Delete" -> {
                            showDeletePostConfirmation(postItem)
                            true
                        }
                        else -> false
                    }
                }
                popup.show()
            }

            if (!postItem.userAvatarUrl.isNullOrEmpty()) {
                val avatarUrl = if (postItem.userAvatarUrl.startsWith("http")) {
                    postItem.userAvatarUrl
                } else {
                    "${RetrofitClient.BASE_URL.removeSuffix("/")}${postItem.userAvatarUrl}"
                }
                Glide.with(this@PostDetailActivity)
                    .load(avatarUrl)
                    .placeholder(R.drawable.ic_profile_holder)
                    .into(ivAvatar)
                tvAvatarInitial.visibility = View.GONE
                ivAvatar.visibility = View.VISIBLE
            } else {
                tvAvatarInitial.text = postItem.userName?.take(1)?.uppercase() ?: "D"
                tvAvatarInitial.visibility = View.VISIBLE
                ivAvatar.visibility = View.GONE
            }
            
            if (postItem.mood != null) {
                tvMood.visibility = View.VISIBLE
                tvMood.text = "is feeling ${postItem.mood}"
            } else {
                tvMood.visibility = View.GONE
            }

            if (!postItem.imagePath.isNullOrEmpty()) {
                ivPostImage.visibility = View.VISIBLE
                val imageUrl = if (postItem.imagePath.startsWith("http")) {
                    postItem.imagePath
                } else {
                    "${RetrofitClient.BASE_URL.removeSuffix("/")}${postItem.imagePath}"
                }
                Glide.with(this@PostDetailActivity)
                    .load(imageUrl)
                    .into(ivPostImage)
            } else {
                ivPostImage.visibility = View.GONE
            }

            ivLike.alpha = if (postItem.isLiked) 1.0f else 0.6f
            ivLike.setColorFilter(if (postItem.isLiked) android.graphics.Color.RED else android.graphics.Color.GRAY)

            llLike.setOnClickListener { toggleLike() }
            // Share in detail activity too
            llShare.setOnClickListener { sharePost() }
        }

        // Setup comments recycler
        commentAdapter = CommentAdapter(
            comments = emptyList(),
            onEditClick = { comment -> showEditCommentDialog(comment) },
            onDeleteClick = { comment -> showDeleteConfirmation(comment) }
        )
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
        val postId = post?.id ?: return
        binding.commentProgress.visibility = View.VISIBLE
        lifecycleScope.launch {
            val result = postRepository.getComments(postId)
            binding.commentProgress.visibility = View.GONE
            if (result.isSuccess) {
                commentAdapter.updateComments(result.getOrDefault(emptyList()))
            }
        }
    }

    private fun addComment(content: String) {
        val user = UserPrefs.getUser()
        val postId = post?.id
        if (user == null || postId == null) {
            if (user == null) Toast.makeText(this, "Login to comment", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnSendComment.isEnabled = false
        lifecycleScope.launch {
            val result = postRepository.addComment(postId, user.id, content)
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
        val postId = post?.id
        if (user == null || postId == null) {
            if (user == null) Toast.makeText(this, "Login to like posts", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            val result = postRepository.toggleLike(postId, user.id)
            if (result.isSuccess) {
                val likeStatus = result.getOrNull()
                likeStatus?.let {
                    binding.postContent.tvLikeCount.text = it.likeCount.toString()
                    binding.postContent.ivLike.alpha = if (it.liked) 1.0f else 0.6f
                    binding.postContent.ivLike.setColorFilter(if (it.liked) android.graphics.Color.RED else android.graphics.Color.GRAY)
                }
            }
        }
    }

    private fun showEditCommentDialog(comment: com.example.dthoughts.models.Comment) {
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle("Edit Comment")
        val input = android.widget.EditText(this)
        input.setText(comment.content)
        builder.setView(input)

        builder.setPositiveButton("Save") { _, _ ->
            val newContent = input.text.toString().trim()
            if (newContent.isNotEmpty()) {
                comment.id?.let { updateComment(it, newContent) }
            }
        }
        builder.setNegativeButton("Cancel") { dialog, _ -> dialog.cancel() }
        builder.show()
    }

    private fun showDeleteConfirmation(comment: com.example.dthoughts.models.Comment) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Delete Comment")
            .setMessage("Are you sure you want to delete this comment?")
            .setPositiveButton("Delete") { _, _ ->
                comment.id?.let { deleteComment(it) }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun updateComment(commentId: Long, content: String) {
        val user = UserPrefs.getUser() ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.updateComment(
                    commentId, 
                    com.example.dthoughts.models.CreateCommentRequest(user.id, content)
                )
                if (response.isSuccessful) {
                    loadComments()
                } else {
                    val errorBody = response.errorBody()?.string()
                    Toast.makeText(this@PostDetailActivity, "Failed to update comment: $errorBody", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PostDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun deleteComment(commentId: Long) {
        val user = UserPrefs.getUser() ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.deleteComment(commentId, user.id)
                if (response.isSuccessful) {
                    loadComments()
                    // Update local post comment count
                    post = post!!.copy(commentCount = post!!.commentCount - 1)
                    binding.postContent.tvCommentCount.text = post!!.commentCount.toString()
                } else {
                    Toast.makeText(this@PostDetailActivity, "Failed to delete comment", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PostDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showEditPostDialog(post: Post) {
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle("Edit Post")
        val input = android.widget.EditText(this)
        input.setText(post.content)
        builder.setView(input)

        builder.setPositiveButton("Save") { _, _ ->
            val newContent = input.text.toString().trim()
            if (newContent.isNotEmpty()) {
                post.id?.let { updatePost(it, newContent) }
            }
        }
        builder.setNegativeButton("Cancel") { dialog, _ -> dialog.cancel() }
        builder.show()
    }

    private fun showDeletePostConfirmation(post: Post) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Delete Post")
            .setMessage("Are you sure you want to delete this post?")
            .setPositiveButton("Delete") { _, _ ->
                post.id?.let { deletePost(it) }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun updatePost(postId: Long, content: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.updatePost(postId, mapOf("content" to content))
                if (response.isSuccessful) {
                    binding.postContent.tvPostContent.text = content
                    this@PostDetailActivity.post = this@PostDetailActivity.post?.copy(content = content)
                } else {
                    Toast.makeText(this@PostDetailActivity, "Failed to update post", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PostDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun deletePost(postId: Long) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.deletePost(postId)
                if (response.isSuccessful) {
                    Toast.makeText(this@PostDetailActivity, "Post deleted", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@PostDetailActivity, "Failed to delete post", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PostDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun sharePost() {
        val shareIntent = android.content.Intent().apply {
            action = android.content.Intent.ACTION_SEND
            putExtra(android.content.Intent.EXTRA_TEXT, "${post?.userName} shared on DThoughts: ${post?.content}")
            type = "text/plain"
        }
        startActivity(android.content.Intent.createChooser(shareIntent, "Share post via"))
    }
}