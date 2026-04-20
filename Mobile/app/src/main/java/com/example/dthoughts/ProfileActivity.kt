package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.example.dthoughts.adapters.PostAdapter
import com.example.dthoughts.databinding.ActivityProfileBinding
import com.example.dthoughts.models.User
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.network.ToggleFollowRequest
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import kotlinx.coroutines.launch
import com.example.dthoughts.R

class ProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProfileBinding
    private val postRepository = PostRepository()
    private val apiService = RetrofitClient.apiService
    private var userId: Long = -1
    private var isFollowing: Boolean = false
    private lateinit var postAdapter: PostAdapter

    private val createPostLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            binding.tabLayout.getTabAt(0)?.select()
            loadUserProfile()
        }
    }

    companion object {
        const val EXTRA_USER_ID = "USER_ID"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Try getting as Long first, then fallback to Int if not found
        userId = intent.getLongExtra(EXTRA_USER_ID, -1L)
        if (userId == -1L) {
            userId = intent.getIntExtra(EXTRA_USER_ID, -1).toLong()
        }

        val currentUser = UserPrefs.getUser()
        if (currentUser == null) {
            binding.bottomNav.visibility = View.GONE
            binding.fabCreate.visibility = View.GONE
        }

        setupToolbar()
        setupRecyclerView()
        setupTabs()
        loadUserProfile()
        setupStatsClickListeners()
        
        binding.btnEditProfile.setOnClickListener {
            startActivity(Intent(this, EditProfileActivity::class.java))
        }

        binding.btnFollow.setOnClickListener {
            if (UserPrefs.isLoggedIn()) {
                toggleFollow()
            } else {
                showLoginPrompt()
            }
        }

        binding.fabCreate.setOnClickListener {
            createPostLauncher.launch(Intent(this, CreatePostActivity::class.java))
        }

        setupBottomNavigation()
    }

    private fun showLoginPrompt() {
        Toast.makeText(this, "Please login to perform this action", Toast.LENGTH_SHORT).show()
        startActivity(Intent(this, LoginActivity::class.java))
    }

    private fun setupBottomNavigation() {
        binding.bottomNav.selectedItemId = R.id.nav_profile
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    startActivity(Intent(this, FeedActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_notifications -> {
                    startActivity(Intent(this, NotificationsActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_create -> {
                    startActivity(Intent(this, CreatePostActivity::class.java))
                    true
                }
                R.id.nav_saved -> {
                    startActivity(Intent(this, DraftsActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_profile -> true
                else -> false
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (userId != -1L) {
            loadUserProfile()
        }
        updateNotificationBadge()
    }

    private fun updateNotificationBadge() {
        val user = UserPrefs.getUser() ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getNotifications(user.id)
                if (response.isSuccessful && response.body() != null) {
                    val unreadCount = response.body()!!.count { !it.isRead }
                    val badge = binding.bottomNav.getOrCreateBadge(R.id.nav_notifications)
                    if (unreadCount > 0) {
                        badge.isVisible = true
                        badge.number = unreadCount
                        badge.backgroundColor = getColor(R.color.rose)
                        badge.badgeTextColor = getColor(R.color.white)
                    } else {
                        badge.isVisible = false
                    }
                }
            } catch (e: Exception) {}
        }
    }

    private fun setupTabs() {
        binding.tabLayout.addOnTabSelectedListener(object : com.google.android.material.tabs.TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: com.google.android.material.tabs.TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> loadUserPosts(userId)
                    1 -> loadLikedPosts(userId)
                    2 -> loadSavedPosts(userId)
                }
            }
            override fun onTabUnselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
            override fun onTabReselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
        })
    }

    private fun reloadCurrentTab() {
        when (binding.tabLayout.selectedTabPosition) {
            0 -> loadUserPosts(userId)
            1 -> loadLikedPosts(userId)
            2 -> loadSavedPosts(userId)
            else -> loadUserPosts(userId)
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        binding.toolbar.setNavigationOnClickListener {
            val intent = Intent(this, FeedActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            finish()
        }
    }

    private fun setupRecyclerView() {
        val currentUser = UserPrefs.getUser()
        postAdapter = PostAdapter(
            emptyList(),
            isLoggedIn = currentUser != null,
            onLikeClick = { post -> 
                currentUser?.let { user ->
                    lifecycleScope.launch {
                        val result = postRepository.toggleLike(post.id ?: 0, user.id)
                        if (result.isSuccess) {
                            reloadCurrentTab()
                        }
                    }
                }
            },
            onCommentClick = { post -> openPostDetail(post) },
            onShareClick = { post -> sharePost(post) },
            onPostClick = { post -> openPostDetail(post) },
            onSaveClick = { post ->
                if (UserPrefs.isLoggedIn()) {
                    currentUser?.let { user ->
                        lifecycleScope.launch {
                            val result = postRepository.toggleSave(post.id ?: 0, user.id)
                            if (result.isSuccess) {
                                reloadCurrentTab()
                            }
                        }
                    }
                } else {
                    showLoginPrompt()
                }
            },
            onEditClick = { post -> showEditPostDialog(post) },
            onDeleteClick = { post -> showDeleteConfirmation(post) },
            onUserClick = { post ->
                post.userId?.let { uid ->
                    if (uid != this@ProfileActivity.userId) {
                        val intent = Intent(this@ProfileActivity, ProfileActivity::class.java)
                        intent.putExtra("USER_ID", uid)
                        startActivity(intent)
                    }
                }
            }
        )
        binding.rvUserPosts.layoutManager = LinearLayoutManager(this)
        binding.rvUserPosts.adapter = postAdapter
    }

    private fun showEditPostDialog(post: com.example.dthoughts.models.Post) {
        val input = android.widget.EditText(this)
        input.setText(post.content)
        android.app.AlertDialog.Builder(this)
            .setTitle("Edit Post")
            .setView(input)
            .setPositiveButton("Update") { _, _ ->
                val newContent = input.text.toString().trim()
                if (newContent.isNotEmpty()) {
                    updatePost(post.id ?: 0, newContent)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun updatePost(postId: Long, content: String) {
        lifecycleScope.launch {
            val result = postRepository.updatePost(postId, content)
            if (result.isSuccess) {
                reloadCurrentTab()
            } else {
                Toast.makeText(this@ProfileActivity, "Failed to update post", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showDeleteConfirmation(post: com.example.dthoughts.models.Post) {
        android.app.AlertDialog.Builder(this)
            .setTitle("Delete Post")
            .setMessage("Are you sure you want to delete this post?")
            .setPositiveButton("Delete") { _, _ ->
                deletePost(post.id ?: 0)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun deletePost(postId: Long) {
        lifecycleScope.launch {
            val result = postRepository.deletePost(postId)
            if (result.isSuccess) {
                reloadCurrentTab()
            } else {
                Toast.makeText(this@ProfileActivity, "Failed to delete post", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openPostDetail(post: com.example.dthoughts.models.Post) {
        val intent = Intent(this, PostDetailActivity::class.java)
        intent.putExtra("POST_JSON", com.google.gson.Gson().toJson(post))
        startActivity(intent)
    }

    private fun sharePost(post: com.example.dthoughts.models.Post) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "${post.userName} shared on DThoughts: ${post.content}")
            type = "text/plain"
        }
        startActivity(Intent.createChooser(shareIntent, "Share post via"))
    }

    private fun loadUserProfile() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val currentUser = UserPrefs.getUser()
                
                // If we don't have a userId from intent (-1), use our logged-in ID
                val targetId = if (userId != -1L) userId else currentUser?.id ?: -1L
                
                // First attempt: Load by ID (Recommended)
                var response = if (targetId != -1L) apiService.getUserById(targetId) else null
                
                // Second attempt fallback: Load by email if ID fails or targetId was -1
                if ((response == null || !response.isSuccessful) && currentUser != null) {
                    response = apiService.getCurrentUser(currentUser.email)
                }

                if (response?.isSuccessful == true && response.body() != null) {
                    val user = response.body()!!
                    userId = user.id // Ensure we have the correct ID for tab loading
                    updateUI(user)
                    reloadCurrentTab()
                    checkFollowStatus(user.id)
                } else {
                    val errorCode = response?.code() ?: "No Response"
                    val errorMessage = response?.errorBody()?.string() ?: "Unknown error"
                    Toast.makeText(this@ProfileActivity, "Profile Error ($errorCode): $errorMessage", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Connection error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun updateUI(user: com.example.dthoughts.models.User) {
        binding.tvFullName.text = "${user.firstName} ${user.lastName}"
        binding.tvEmail.text = "@${user.email.split("@")[0]}"
        binding.tvBio.text = user.bio ?: "No bio yet."
        binding.tvFollowerCountCard.text = (user.followerCount ?: 0).toString()
        binding.tvFollowingCountCard.text = (user.followingCount ?: 0).toString()
        binding.tvLikesCount.text = (user.totalLikes ?: 0).toString()
        binding.tvThoughtsCount.text = (user.totalPosts ?: 0).toString()

        binding.tvRole.text = "✦ ROLE: USER"
        binding.tvBornDate.text = "🎂 Born August 24, 2003"
        binding.tvJoinedDate.text = "📅 Joined June 2024"

        if (!user.avatarUrl.isNullOrEmpty()) {
            val fullUrl = if (user.avatarUrl.startsWith("http")) user.avatarUrl else "${RetrofitClient.BASE_URL.removeSuffix("/")}${user.avatarUrl}"
            Glide.with(this)
                .load(fullUrl)
                .placeholder(R.drawable.ic_profile_holder)
                .error(R.drawable.ic_profile_holder)
                .into(binding.ivAvatar)
        } else {
            binding.ivAvatar.setImageResource(R.drawable.ic_profile_holder)
        }

        if (!user.coverImageUrl.isNullOrEmpty()) {
            val fullUrl = if (user.coverImageUrl.startsWith("http")) user.coverImageUrl else "${RetrofitClient.BASE_URL.removeSuffix("/")}${user.coverImageUrl}"
            Glide.with(this)
                .load(fullUrl)
                .placeholder(R.color.feed_surface)
                .error(R.color.feed_surface)
                .centerCrop()
                .into(binding.ivCover)
        } else {
            binding.ivCover.setImageResource(R.color.feed_surface)
        }

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
            } catch (e: Exception) {}
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
                    updateFollowButton()
                    // Update follower count immediately
                    binding.tvFollowerCountCard.text = status.followerCount.toString()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProfileActivity, "Follow action failed", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnFollow.isEnabled = true
            }
        }
    }

    private fun updateFollowButton() {
        if (isFollowing) {
            binding.btnFollow.text = "✓ Following"
            binding.btnFollow.setBackgroundColor(getColor(R.color.amber_pale))
            binding.btnFollow.setTextColor(getColor(R.color.espresso))
            // Using MaterialButton's stroke methods
            binding.btnFollow.strokeWidth = (1 * resources.displayMetrics.density).toInt()
            binding.btnFollow.setStrokeColorResource(R.color.divider_light)
        } else {
            binding.btnFollow.text = "Follow"
            binding.btnFollow.setBackgroundColor(getColor(R.color.espresso))
            binding.btnFollow.setTextColor(getColor(R.color.white))
            binding.btnFollow.strokeWidth = 0
        }
    }

    private fun setupStatsClickListeners() {
        binding.tvThoughtsCount.parent.let { it as? View }?.setOnClickListener {
            binding.tabLayout.getTabAt(0)?.select()
        }
        binding.tvLikesCount.parent.let { it as? View }?.setOnClickListener {
            binding.tabLayout.getTabAt(1)?.select()
        }
    }

    private fun loadUserPosts(userId: Long) {
        if (userId == -1L) return
        lifecycleScope.launch {
            try {
                val response = apiService.getUserPosts(userId)
                if (response.isSuccessful && response.body() != null) {
                    postAdapter.updatePosts(response.body()!!.content)
                } else {
                    postAdapter.updatePosts(emptyList())
                }
            } catch (e: Exception) {
                postAdapter.updatePosts(emptyList())
            }
        }
    }

    private fun loadLikedPosts(userId: Long) {
        if (userId == -1L) return
        lifecycleScope.launch {
            try {
                val response = apiService.getLikedPosts(userId)
                if (response.isSuccessful && response.body() != null) {
                    val posts = response.body()!!.map { it.copy(isLiked = true) }
                    postAdapter.updatePosts(posts)
                } else {
                    postAdapter.updatePosts(emptyList())
                }
            } catch (e: Exception) {
                postAdapter.updatePosts(emptyList())
            }
        }
    }

    private fun loadSavedPosts(userId: Long) {
        if (userId == -1L) return
        lifecycleScope.launch {
            try {
                val response = apiService.getSavedPosts(userId)
                if (response.isSuccessful && response.body() != null) {
                    val posts = response.body()!!.map { it.copy(isSaved = true) }
                    postAdapter.updatePosts(posts)
                } else {
                    postAdapter.updatePosts(emptyList())
                }
            } catch (e: Exception) {
                postAdapter.updatePosts(emptyList())
            }
        }
    }
}
