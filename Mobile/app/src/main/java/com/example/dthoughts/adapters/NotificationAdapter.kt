package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.dthoughts.R
import com.example.dthoughts.databinding.ItemNotificationBinding
import com.example.dthoughts.models.Notification

class NotificationAdapter(
    private var notifications: List<Notification>,
    private val onNotificationClick: (Notification) -> Unit,
    private val onMarkReadClick: (Notification) -> Unit
) : RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder>() {

    inner class NotificationViewHolder(val binding: ItemNotificationBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val binding = ItemNotificationBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return NotificationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        val notification = notifications[position]
        val context = holder.itemView.context

        with(holder.binding) {
            // Unread state
            viewUnreadDot.visibility = if (notification.isRead) View.GONE else View.VISIBLE
            btnMarkRead.visibility = if (notification.isRead) View.GONE else View.VISIBLE
            cardNotif.setCardBackgroundColor(
                if (notification.isRead) context.getColor(R.color.white) 
                else context.getColor(R.color.amber_pale)
            )

            // Actor avatar
            Glide.with(context)
                .load(notification.actorAvatarUrl)
                .placeholder(R.drawable.ic_profile_holder)
                .into(ivActorAvatar)

            // Type icon & text
            val typeIcon: String
            val typeTextSuffix: String
            
            when (notification.type) {
                "LIKE" -> {
                    typeIcon = "❤️"
                    typeTextSuffix = context.getString(R.string.notif_liked)
                    tvPostPreview.visibility = View.VISIBLE
                    tvPostPreview.text = notification.previewText
                }
                "COMMENT" -> {
                    typeIcon = "💬"
                    typeTextSuffix = context.getString(R.string.notif_commented)
                    tvPostPreview.visibility = View.VISIBLE
                    tvPostPreview.text = notification.message ?: notification.previewText
                }
                "FOLLOW" -> {
                    typeIcon = "👤"
                    typeTextSuffix = context.getString(R.string.notif_followed)
                    tvPostPreview.visibility = View.GONE
                }
                "POST" -> {
                    typeIcon = "📝"
                    typeTextSuffix = context.getString(R.string.notif_posted)
                    tvPostPreview.visibility = View.VISIBLE
                    tvPostPreview.text = notification.previewText
                }
                else -> {
                    typeIcon = "📢"
                    typeTextSuffix = "sent a notification"
                    tvPostPreview.visibility = View.GONE
                }
            }

            tvTypeIcon.text = typeIcon
            tvNotifText.text = "${notification.actorName} $typeTextSuffix"
            tvTime.text = notification.createdAt // Assuming formatted

            root.setOnClickListener { onNotificationClick(notification) }
            btnMarkRead.setOnClickListener { onMarkReadClick(notification) }
        }
    }

    override fun getItemCount() = notifications.size

    fun updateNotifications(newNotifications: List<Notification>) {
        notifications = newNotifications
        notifyDataSetChanged()
    }
}