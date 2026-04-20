package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.NotificationAdapter
import com.example.dthoughts.databinding.ActivityNotificationsBinding
import com.example.dthoughts.models.Notification
import com.example.dthoughts.utils.UserPrefs
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.network.RetrofitClient
import android.widget.Toast
import kotlinx.coroutines.launch

class NotificationsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityNotificationsBinding
    private lateinit var notificationAdapter: NotificationAdapter
    private var allNotifications: List<Notification> = emptyList()
    private var currentFilterIsAll: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityNotificationsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        loadNotifications()
    }

    private fun setupUI() {
        binding.bottomNav.selectedItemId = R.id.nav_notifications
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    startActivity(Intent(this, FeedActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_notifications -> true
                R.id.nav_create -> {
                    startActivity(Intent(this, CreatePostActivity::class.java))
                    true
                }
                R.id.nav_saved -> {
                    startActivity(Intent(this, DraftsActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_profile -> {
                    val user = UserPrefs.getUser()
                    if (user != null) {
                        val intent = Intent(this, ProfileActivity::class.java)
                        intent.putExtra("USER_ID", user.id)
                        startActivity(intent)
                        finish()
                    } else {
                        startActivity(Intent(this, LoginActivity::class.java))
                    }
                    true
                }
                else -> false
            }
        }

        binding.pillAll.setOnClickListener {
            updateFilterPills(true)
            filterNotifications(true)
        }

        binding.pillUnread.setOnClickListener {
            updateFilterPills(false)
            filterNotifications(false)
        }

        binding.tvMarkAll.setOnClickListener {
            markAllAsRead()
        }
    }

    override fun onResume() {
        super.onResume()
        loadNotifications()
    }

    private fun filterNotifications(isAll: Boolean) {
        currentFilterIsAll = isAll
        val filteredList = if (isAll) {
            allNotifications
        } else {
            allNotifications.filter { !it.isRead }
        }
        notificationAdapter.updateNotifications(filteredList)
        
        if (filteredList.isEmpty()) {
            binding.layoutEmpty.visibility = View.VISIBLE
            binding.tvEmptyMessage.text = if (isAll) "No notifications yet." else "No unread notifications."
        } else {
            binding.layoutEmpty.visibility = View.GONE
        }
    }

    private fun markAllAsRead() {
        val user = UserPrefs.getUser() ?: return
        
        allNotifications.forEach { it.isRead = true }
        filterNotifications(currentFilterIsAll)
        updateUnreadUI()
        
        lifecycleScope.launch {
            try {
                RetrofitClient.apiService.markAllNotificationsAsRead(user.id)
            } catch (e: Exception) {}
        }
    }

    private fun updateFilterPills(isAll: Boolean) {
        if (isAll) {
            binding.pillAll.setBackgroundResource(R.drawable.bg_tab_item_active)
            binding.pillUnread.setBackgroundResource(android.R.color.transparent)
        } else {
            binding.pillAll.setBackgroundResource(android.R.color.transparent)
            binding.pillUnread.setBackgroundResource(R.drawable.bg_tab_item_active)
        }
    }

    private fun setupRecyclerView() {
        notificationAdapter = NotificationAdapter(
            notifications = emptyList(),
            onNotificationClick = { notification ->
                handleNotificationClick(notification)
            },
            onMarkReadClick = { notification ->
                markAsRead(notification)
            }
        )
        binding.rvNotifications.layoutManager = LinearLayoutManager(this)
        binding.rvNotifications.adapter = notificationAdapter

        binding.swipeRefresh.setOnRefreshListener {
            loadNotifications()
        }
    }

    private fun handleNotificationClick(notification: Notification) {
        markAsRead(notification)
        
        when (notification.type) {
            "LIKE", "COMMENT", "POST" -> {
                if (notification.targetId != null) {
                    val intent = Intent(this, PostDetailActivity::class.java)
                    intent.putExtra("POST_ID", notification.targetId)
                    startActivity(intent)
                }
            }
            "FOLLOW" -> {
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("USER_ID", notification.actorId)
                startActivity(intent)
            }
        }
    }

    private fun markAsRead(notification: Notification) {
        if (notification.isRead) return
        
        notification.isRead = true
        filterNotifications(currentFilterIsAll)
        updateUnreadUI()
        
        lifecycleScope.launch {
            try {
                RetrofitClient.apiService.markNotificationAsRead(notification.id)
            } catch (e: Exception) {}
        }
    }

    private fun loadNotifications() {
        val user = UserPrefs.getUser() ?: return
        binding.swipeRefresh.isRefreshing = true
        
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getNotifications(user.id)
                if (response.isSuccessful && response.body() != null) {
                    allNotifications = response.body()!!
                    filterNotifications(currentFilterIsAll)
                    updateUnreadUI()
                }
            } catch (e: Exception) {
                Toast.makeText(this@NotificationsActivity, "Error loading notifications", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun updateUnreadUI() {
        val unreadCount = allNotifications.count { !it.isRead }
        
        // Update the list header text
        if (unreadCount > 0) {
            binding.tvUnreadCount.visibility = View.VISIBLE
            binding.tvUnreadCount.text = "$unreadCount unread notifications"
            binding.tvMarkAll.visibility = View.VISIBLE
            binding.tvUnreadBadge.visibility = View.VISIBLE
            binding.tvUnreadBadge.text = unreadCount.toString()
        } else {
            binding.tvUnreadCount.visibility = View.GONE
            binding.tvMarkAll.visibility = View.GONE
            binding.tvUnreadBadge.visibility = View.GONE
        }

        // Update the Bottom Navigation Badge
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
}