package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.ItemCommentBinding
import com.example.dthoughts.models.Comment

class CommentAdapter(private var comments: List<Comment>) : RecyclerView.Adapter<CommentAdapter.CommentViewHolder>() {

    inner class CommentViewHolder(val binding: ItemCommentBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommentViewHolder {
        val binding = ItemCommentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CommentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CommentViewHolder, position: Int) {
        val comment = comments[position]
        with(holder.binding) {
            tvAuthorName.text = comment.userName ?: "Anonymous"
            tvCommentContent.text = comment.content
            
            val avatarUrl = comment.userAvatarUrl
            if (!avatarUrl.isNullOrEmpty()) {
                val fullUrl = if (avatarUrl.startsWith("http")) avatarUrl else "${com.example.dthoughts.network.RetrofitClient.BASE_URL}$avatarUrl"
                com.bumptech.glide.Glide.with(root.context)
                    .load(fullUrl)
                    .placeholder(com.example.dthoughts.R.drawable.ic_profile_holder)
                    .into(ivAvatar)
                tvAvatarInitial.visibility = android.view.View.GONE
                ivAvatar.visibility = android.view.View.VISIBLE
            } else {
                tvAvatarInitial.text = comment.userName?.take(1)?.uppercase() ?: "D"
                tvAvatarInitial.visibility = android.view.View.VISIBLE
                ivAvatar.visibility = android.view.View.GONE
            }
            
            tvTime.text = comment.createdAt ?: "Just now"
        }
    }

    override fun getItemCount() = comments.size

    fun updateComments(newComments: List<Comment>) {
        comments = newComments
        notifyDataSetChanged()
    }
}