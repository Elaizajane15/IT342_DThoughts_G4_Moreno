package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.PostCardBinding
import com.example.dthoughts.models.Post
import com.bumptech.glide.Glide

class PostAdapter(
    private var posts: List<Post>,
    private var isLoggedIn: Boolean = false,
    private val onLikeClick: (Post) -> Unit,
    private val onCommentClick: (Post) -> Unit,
    private val onShareClick: (Post) -> Unit
) : RecyclerView.Adapter<PostAdapter.PostViewHolder>() {

    private val moodsMap = mapOf(
        "HAPPY" to "😊",
        "SAD" to "😢",
        "EXCITED" to "🤩",
        "TIRED" to "😴",
        "ANGRY" to "😠",
        "THOUGHTFUL" to "🤔",
        "GRATEFUL" to "😇",
        "LOVED" to "🥰"
    )

    class PostViewHolder(val binding: PostCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val binding = PostCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PostViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        val post = posts[position]
        with(holder.binding) {
            tvUserName.text = post.userName ?: "Unknown User"
            tvUsername.text = "" // Could parse from email if available
            tvPostContent.text = post.content
            tvLikeCount.text = post.likeCount.toString()
            tvCommentCount.text = post.commentCount.toString()
            
            // Mood display
            if (!post.mood.isNullOrEmpty()) {
                tvMood.visibility = View.VISIBLE
                val emoji = moodsMap[post.mood.uppercase()] ?: ""
                tvMood.text = "is feeling $emoji"
            } else {
                tvMood.visibility = View.GONE
            }

            // Avatar display
            val avatarUrl = post.userAvatarUrl
            if (!avatarUrl.isNullOrEmpty()) {
                val fullUrl = if (avatarUrl.startsWith("http")) avatarUrl else "http://10.0.2.2:8080$avatarUrl"
                Glide.with(root.context)
                    .load(fullUrl)
                    .placeholder(com.example.dthoughts.R.drawable.ic_profile_holder)
                    .into(ivAvatar)
                tvAvatarInitial.visibility = View.GONE
                ivAvatar.visibility = View.VISIBLE
            } else {
                tvAvatarInitial.text = (post.userName ?: "U").take(1).uppercase()
                tvAvatarInitial.visibility = View.VISIBLE
                ivAvatar.visibility = View.GONE
            }

            // Image display
            val imageUrl = post.imagePath
            if (!imageUrl.isNullOrEmpty()) {
                ivPostImage.visibility = View.VISIBLE
                val fullImageUrl = if (imageUrl.startsWith("http")) imageUrl else "http://10.0.2.2:8080$imageUrl"
                Glide.with(root.context).load(fullImageUrl).into(ivPostImage)
            } else {
                ivPostImage.visibility = View.GONE
            }

            // Like state
            if (post.isLiked) {
                ivLike.setColorFilter(androidx.core.content.ContextCompat.getColor(root.context, com.example.dthoughts.R.color.like_icon_liked))
                ivLike.alpha = 1.0f
            } else {
                ivLike.setColorFilter(androidx.core.content.ContextCompat.getColor(root.context, com.example.dthoughts.R.color.like_icon_default))
                ivLike.alpha = 0.6f
            }
            
            // Like and Comment interactivity based on login status
            if (isLoggedIn) {
                llLike.alpha = 1.0f
                llComment.alpha = 1.0f
                llLike.isClickable = true
                llComment.isClickable = true
            } else {
                llLike.alpha = 0.5f
                llComment.alpha = 0.5f
                llLike.isClickable = true // We still want the click to trigger the "Please login" toast in Activity
                llComment.isClickable = true
            }

            llLike.setOnClickListener { onLikeClick(post) }
            llComment.setOnClickListener { onCommentClick(post) }
            llShare.setOnClickListener { onShareClick(post) }
        }
    }

    override fun getItemCount() = posts.size

    fun updatePosts(newPosts: List<Post>) {
        posts = newPosts
        notifyDataSetChanged()
    }
}
