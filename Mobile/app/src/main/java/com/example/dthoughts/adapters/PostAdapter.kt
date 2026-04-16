package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.PostCardBinding
import com.example.dthoughts.models.Post

class PostAdapter(
    private var posts: List<Post>,
    private val onLikeClick: (Post) -> Unit,
    private val onCommentClick: (Post) -> Unit,
    private val onShareClick: (Post) -> Unit
) : RecyclerView.Adapter<PostAdapter.PostViewHolder>() {

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