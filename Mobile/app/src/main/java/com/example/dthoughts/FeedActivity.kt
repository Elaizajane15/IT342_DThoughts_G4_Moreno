package com.example.dthoughts

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.PostAdapter
import com.example.dthoughts.databinding.ActivityFeedBinding
import com.example.dthoughts.models.Post
import com.example.dthoughts.models.User
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import com.google.gson.Gson
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
        
        setupUI()
        setupRecyclerView()
        loadPosts(true)

        // Optimized back handling for Android 13+ Predictive Back
        val backCallback = object : androidx.activity.OnBackPressedCallback(false) {
            override fun handleOnBackPressed() {
                binding.drawerLayout.closeDrawer(androidx.core.view.GravityCompat.START)
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

    private fun setupUI() {
        if (currentUser == null) {
            binding.guestBanner.visibility = View.VISIBLE
            binding.composeBox.visibility = View.GONE
        } else {
            binding.guestBanner.visibility = View.GONE
            binding.composeBox.visibility = View.VISIBLE
            setupDrawer()
        }

        binding.ivProfile.setOnClickListener {
            if (currentUser != null) {
                binding.drawerLayout.openDrawer(androidx.core.view.GravityCompat.START)
            } else {
                startActivity(Intent(this, LoginActivity::class.java))
            }
        }

        binding.ivCreatePost.setOnClickListener {
            if (currentUser != null) {
                createPostLauncher.launch(Intent(this, CreatePostActivity::class.java))
            } else {
                Toast.makeText(this, "Please login to create a post", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, LoginActivity::class.java))
            }
        }

        binding.btnGuestLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }

        binding.swipeRefresh.setOnRefreshListener {
            loadPosts(true)
        }

        binding.tabForYou.setOnClickListener {
            if (!isForYouTab) {
                isForYouTab = true
                updateTabs()
                loadPosts(true)
            }
        }

        binding.tabFollowing.setOnClickListener {
            if (currentUser == null) {
                Toast.makeText(this, "Login to see following feed", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, LoginActivity::class.java))
                return@setOnClickListener
            }
            if (isForYouTab) {
                isForYouTab = false
                updateTabs()
                loadPosts(true)
            }
        }

        binding.btnRetry.setOnClickListener {
            loadPosts(true)
        }

        binding.btnLoadMore.setOnClickListener {
            loadPosts(false)
        }
        
        binding.etCompose.setOnClickListener {
            createPostLauncher.launch(Intent(this, CreatePostActivity::class.java))
        }
    }

    private fun updateTabs() {
        if (isForYouTab) {
            binding.tabForYou.setBackgroundResource(R.drawable.tab_selected)
            binding.tabForYou.setTextColor(ContextCompat.getColor(this, R.color.feed_ink))
            binding.tabFollowing.setBackgroundResource(R.drawable.tab_unselected)
            binding.tabFollowing.setTextColor(ContextCompat.getColor(this, R.color.feed_muted))
        } else {
            binding.tabFollowing.setBackgroundResource(R.drawable.tab_selected)
            binding.tabFollowing.setTextColor(ContextCompat.getColor(this, R.color.feed_ink))
            binding.tabForYou.setBackgroundResource(R.drawable.tab_unselected)
            binding.tabForYou.setTextColor(ContextCompat.getColor(this, R.color.feed_muted))
        }
    }

    private fun setupRecyclerView() {
        postAdapter = PostAdapter(
            posts = allPosts,
            isLoggedIn = currentUser != null,
            onLikeClick = { post -> toggleLike(post) },
            onCommentClick = { post -> openPostDetail(post) },
            onShareClick = { post -> sharePost(post) }
        )
        binding.rvPosts.layoutManager = LinearLayoutManager(this)
        binding.rvPosts.adapter = postAdapter
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

    private fun setupDrawer() {
        currentUser?.let { user ->
            binding.drawerProfile.tvDrawerName.text = "${user.firstName} ${user.lastName}"
            binding.drawerProfile.tvDrawerUsername.text = user.email
            binding.drawerProfile.tvFollowersCount.text = (user.followerCount ?: 0).toString()
            binding.drawerProfile.tvFollowingCount.text = (user.followingCount ?: 0).toString()

            val openProfile = {
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("USER_ID", user.id)
                startActivity(intent)
                binding.drawerLayout.closeDrawers()
            }

            binding.drawerProfile.headerProfile.setOnClickListener { openProfile() }
            binding.drawerProfile.menuProfile.setOnClickListener { openProfile() }

            binding.drawerProfile.menuLogout.setOnClickListener {
                UserPrefs.clear()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
        }
    }
}
