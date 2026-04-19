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
        allNotifications.forEach { it.isRead = true }
        filterNotifications(currentFilterIsAll)
        updateUnreadUI()
        // Here you would also call an API to mark all as read on the server
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
                // Navigate to PostDetailActivity (if it exists)
                // For now, let's just log or show a toast if we don't have the activity yet
                // val intent = Intent(this, PostDetailActivity::class.java)
                // intent.putExtra("POST_ID", notification.targetId)
                // startActivity(intent)
            }
            "FOLLOW" -> {
                val intent = Intent(this, ProfileActivity::class.java)
                intent.putExtra("USER_ID", notification.actorId)
                startActivity(intent)
            }
        }
    }

    private fun markAsRead(notification: Notification) {
        notification.isRead = true
        filterNotifications(currentFilterIsAll)
        updateUnreadUI()
        // API call to mark single notification as read
    }

    private fun loadNotifications() {
        binding.swipeRefresh.isRefreshing = true
        // Mock data for now or API call
        allNotifications = listOf(
            Notification(1, "LIKE", 101, "Karla Manalo", null, 1, "Sometimes the best thing you can do is sit quietly...", "2m ago", false),
            Notification(2, "COMMENT", 102, "John Doe", null, 1, "I totally agree with this!", "1h ago", true),
            Notification(3, "FOLLOW", 103, "Alice Smith", null, null, null, "3h ago", false),
            Notification(4, "POST", 104, "DThoughts Official", null, 2, "Welcome to the new version of DThoughts!", "5h ago", false)
        )
        
        binding.swipeRefresh.isRefreshing = false
        filterNotifications(currentFilterIsAll)
        updateUnreadUI()
    }

    private fun updateUnreadUI() {
        val unreadCount = allNotifications.count { !it.isRead }
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
    }
}