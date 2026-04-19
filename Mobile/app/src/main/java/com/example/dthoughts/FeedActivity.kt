package com.example.dthoughts

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.PostAdapter
import com.example.dthoughts.databinding.ActivityFeedBinding
import com.example.dthoughts.models.Post
import com.example.dthoughts.models.User
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.launch

class FeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityFeedBinding
    private lateinit var postAdapter: PostAdapter
    private val postRepository = PostRepository(RetrofitClient.apiService)
    
    private var currentUser: User? = null
    private var isForYouTab = true
    private var currentPage = 0
    private val allPosts = mutableListOf<Post>()

    private val createPostLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            loadPosts(true)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        currentUser = UserPrefs.getUser()
        setupRecyclerView()
        setupUI()
        setupBottomNavigation()
        setupDrawerListeners()

        // Optimized back handling for Android 13+ Predictive Back
        val backCallback = object : androidx.activity.OnBackPressedCallback(false) {
            override fun handleOnBackPressed() {
                binding.drawerLayout.closeDrawer(GravityCompat.START)
            }
        }
        onBackPressedDispatcher.addCallback(this, backCallback)

        binding.drawerLayout.addDrawerListener(object : androidx.drawerlayout.widget.DrawerLayout.SimpleDrawerListener() {
            override fun onDrawerOpened(drawerView: android.view.View) {
                backCallback.isEnabled = true
            }
            override fun onDrawerClosed(drawerView: android.view.View) {
                backCallback.isEnabled = false
            }
        })
    }

    override fun onResume() {
        super.onResume()
        val updatedUser = UserPrefs.getUser()
        if (updatedUser != currentUser) {
            currentUser = updatedUser
            updateUserUI()
            setupRecyclerView() // Re-init adapter to update isLoggedIn status
        } else {
            updateUserUI()
        }
        loadPosts(true)
    }

    private fun setupUI() {
        binding.ivProfile.setOnClickListener {
            if (currentUser != null) {
                binding.drawerLayout.openDrawer(GravityCompat.START)
            } else {
                startActivity(Intent(this, LoginActivity::class.java))
            }
        }

        binding.swipeRefresh.setOnRefreshListener {
            loadPosts(true)
        }

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> {
                        if (!isForYouTab) {
                            isForYouTab = true
                            loadPosts(true)
                        }
                    }
                    1 -> {
                        if (currentUser == null) {
                            Toast.makeText(this@FeedActivity, "Login to see following feed", Toast.LENGTH_SHORT).show()
                            startActivity(Intent(this@FeedActivity, LoginActivity::class.java))
                            binding.tabLayout.getTabAt(0)?.select()
                            return
                        }
                        if (isForYouTab) {
                            isForYouTab = false
                            loadPosts(true)
                        }
                    }
                }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {
                loadPosts(true)
            }
        })

        binding.btnRetry.setOnClickListener {
            loadPosts(true)
        }

        binding.btnLoadMore.setOnClickListener {
            loadPosts(false)
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNav.selectedItemId = R.id.nav_home
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> true
                R.id.nav_notifications -> {
                    startActivity(Intent(this, NotificationsActivity::class.java))
                    true
                }
                R.id.nav_create -> {
                    startActivity(Intent(this, CreatePostActivity::class.java))
                    true
                }
                R.id.nav_saved -> {
                    startActivity(Intent(this, DraftsActivity::class.java))
                    true
                }
                R.id.nav_profile -> {
                    val user = UserPrefs.getUser()
                    if (user != null) {
                        val intent = Intent(this, ProfileActivity::class.java)
                        intent.putExtra("USER_ID", user.id)
                        startActivity(intent)
                    } else {
                        startActivity(Intent(this, LoginActivity::class.java))
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun updateUserUI() {
        if (currentUser != null) {
            val user = currentUser!!
            binding.drawerProfile.tvDrawerName.text = "${user.firstName} ${user.lastName}"
            binding.drawerProfile.tvDrawerUsername.text = user.email
            binding.drawerProfile.tvFollowersCount.text = (user.followerCount ?: 0).toString()
            binding.drawerProfile.tvFollowingCount.text = (user.followingCount ?: 0).toString()

            // Update Feed Header Avatar
            if (!user.avatarUrl.isNullOrEmpty()) {
                val fullUrl = if (user.avatarUrl.startsWith("http")) user.avatarUrl else "${RetrofitClient.BASE_URL.removeSuffix("/")}${user.avatarUrl}"
                com.bumptech.glide.Glide.with(this)
                    .load(fullUrl)
                    .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.NONE)
                    .skipMemoryCache(true)
                    .placeholder(R.drawable.ic_profile_holder)
                    .into(binding.ivProfile)
                
                // Also update drawer avatar
                com.bumptech.glide.Glide.with(this)
                    .load(fullUrl)
                    .diskCacheStrategy(com.bumptech.glide.load.engine.DiskCacheStrategy.NONE)
                    .skipMemoryCache(true)
                    .placeholder(R.drawable.ic_profile_holder)
                    .circleCrop()
                    .into(binding.drawerProfile.ivDrawerAvatar)
            } else {
                binding.ivProfile.setImageResource(R.drawable.ic_profile_holder)
                binding.drawerProfile.ivDrawerAvatar.setImageResource(R.drawable.ic_profile_holder)
            }
        }
    }

    private fun setupDrawerListeners() {
        val openProfile = {
            currentUser?.let { user ->
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("USER_ID", user.id)
                startActivity(intent)
                binding.drawerLayout.closeDrawers()
            }
        }

        binding.drawerProfile.headerProfile.setOnClickListener { openProfile() }
        binding.drawerProfile.menuProfile.setOnClickListener { openProfile() }

        binding.drawerProfile.menuLogout.setOnClickListener {
            UserPrefs.clear()
            currentUser = null
            updateUserUI()
            setupRecyclerView()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun setupRecyclerView() {
        postAdapter = PostAdapter(
            posts = allPosts,
            isLoggedIn = currentUser != null,
            onLikeClick = { post -> toggleLike(post) },
            onCommentClick = { post -> openPostDetail(post) },
            onShareClick = { post -> sharePost(post) },
            onPostClick = { post -> openPostDetail(post) },
            onEditClick = { post -> showEditPostDialog(post) },
            onDeleteClick = { post -> showDeleteConfirmation(post) }
        )
        binding.rvPosts.layoutManager = LinearLayoutManager(this)
        binding.rvPosts.adapter = postAdapter
    }

    private fun showEditPostDialog(post: Post) {
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
                loadPosts(true)
            } else {
                Toast.makeText(this@FeedActivity, "Failed to update post", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showDeleteConfirmation(post: Post) {
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
                loadPosts(true)
            } else {
                Toast.makeText(this@FeedActivity, "Failed to delete post", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadPosts(refresh: Boolean) {
        if (refresh) {
            currentPage = 0
            allPosts.clear()
            binding.progressBar.visibility = View.VISIBLE
        }

        lifecycleScope.launch {
            val result = if (isForYouTab) {
                postRepository.getPosts(currentPage)
            } else {
                postRepository.getFollowingPosts(currentUser?.id ?: -1, currentPage)
            }

            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false

            if (result.isSuccess) {
                val posts = result.getOrDefault(emptyList())
                if (posts.isNotEmpty()) {
                    allPosts.addAll(posts)
                    postAdapter.updatePosts(allPosts)
                    currentPage++
                    binding.btnLoadMore.visibility = View.VISIBLE
                    binding.emptyState.visibility = View.GONE
                } else if (refresh) {
                    binding.emptyState.visibility = View.VISIBLE
                    binding.btnLoadMore.visibility = View.GONE
                } else {
                    binding.btnLoadMore.visibility = View.GONE
                    Toast.makeText(this@FeedActivity, "No more posts", Toast.LENGTH_SHORT).show()
                }
                binding.bannerError.visibility = View.GONE
            } else {
                binding.bannerError.visibility = View.VISIBLE
                binding.tvErrorMsg.text = result.exceptionOrNull()?.message ?: "Failed to load posts"
                if (refresh) {
                    allPosts.clear()
                    postAdapter.updatePosts(allPosts)
                }
            }
        }
    }

    private fun toggleLike(post: Post) {
        if (currentUser == null) {
            Toast.makeText(this, "Login to like posts", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, LoginActivity::class.java))
            return
        }

        lifecycleScope.launch {
            val result = postRepository.toggleLike(post.id!!, currentUser!!.id)
            if (result.isSuccess) {
                val likeStatus = result.getOrNull()
                likeStatus?.let { status ->
                    val index = allPosts.indexOfFirst { it.id == post.id }
                    if (index != -1) {
                        val updatedPost = allPosts[index].copy(
                            isLiked = status.liked,
                            likeCount = status.likeCount
                        )
                        allPosts[index] = updatedPost
                        postAdapter.notifyItemChanged(index)
                    }
                }
            } else {
                Toast.makeText(this@FeedActivity, "Action failed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openPostDetail(post: Post) {
        if (currentUser == null) {
            Toast.makeText(this, "Please login to view details and comments", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, LoginActivity::class.java))
            return
        }
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
