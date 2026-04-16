package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.PostCardBinding
import com.example.dthoughts.models.Post

import android.view.View
import com.bumptech.glide.Glide
import com.example.dthoughts.R

class PostAdapter(
    private var posts: List<Post>,
    private val onLikeClick: (Post) -> Unit,
    private val onCommentClick: (Post) -> Unit,
    private val onShareClick: (Post) -> Unit
) : RecyclerView.Adapter<PostAdapter.PostViewHolder>() {

    private val moodsMap = mapOf(
        "Happy" to "😊",
        "Reflective" to "🤔",
        "Sad" to "😢",
        "Motivated" to "💪",
        "Peaceful" to "😌",
        "Frustrated" to "😤",
        "Excited" to "🎉",
        "Tired" to "😴"
    )

    inner class PostViewHolder(val binding: PostCardBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostViewHolder {
        val binding = PostCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PostViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PostViewHolder, position: Int) {
        val post = posts[position]
        with(holder.binding) {
            tvUserName.text = "${post.author.firstName} ${post.author.lastName}"
            tvUsername.text = "@${post.author.email.split("@")[0]}"
            tvPostContent.text = post.content
            tvLikeCount.text = post.likeCount.toString()
            tvCommentCount.text = post.commentCount.toString()
            tvAvatarInitial.text = post.author.firstName.take(1).uppercase()
            
            // Mood display
            if (!post.mood.isNullOrEmpty()) {
                tvMood.visibility = View.VISIBLE
                val emoji = moodsMap[post.mood] ?: ""
                tvMood.text = "is feeling $emoji"
            } else {
                tvMood.visibility = View.GONE
            }

            // Image display
            if (!post.imageUrl.isNullOrEmpty()) {
                ivPostImage.visibility = View.VISIBLE
                val fullImageUrl = if (post.imageUrl.startsWith("http")) post.imageUrl else "http://10.0.2.2:8080${post.imageUrl}"
                // Note: Using a placeholder if Glide is not yet ready or failed to resolve
                // Glide.with(root.context).load(fullImageUrl).into(ivPostImage)
                // For now, let's just use it and assume Glide dependency will be fixed
                try {
                    com.bumptech.glide.Glide.with(root.context).load(fullImageUrl).into(ivPostImage)
                } catch (e: Exception) {
                    ivPostImage.visibility = View.GONE
                }
            } else {
                ivPostImage.visibility = View.GONE
            }

            // Like state
            ivLike.alpha = if (post.isLiked) 1.0f else 0.6f
            ivLike.setColorFilter(if (post.isLiked) android.graphics.Color.RED else android.graphics.Color.GRAY)
            
            // TODO: Handle time ago properly
            tvTimeAgo.text = "• 1h"

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