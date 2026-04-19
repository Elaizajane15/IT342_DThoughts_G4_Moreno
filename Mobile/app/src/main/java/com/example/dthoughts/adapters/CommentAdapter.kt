package com.example.dthoughts.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.ItemCommentBinding
import com.example.dthoughts.models.Comment

class CommentAdapter(
    private var comments: List<Comment>,
    private val onEditClick: (Comment) -> Unit,
    private val onDeleteClick: (Comment) -> Unit
) : RecyclerView.Adapter<CommentAdapter.CommentViewHolder>() {

    private val currentUser = com.example.dthoughts.utils.UserPrefs.getUser()

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
                val fullUrl = if (avatarUrl.startsWith("http")) avatarUrl else "${com.example.dthoughts.network.RetrofitClient.BASE_URL.removeSuffix("/")}$avatarUrl"
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

            if (currentUser != null && currentUser.id == comment.userId) {
                btnMoreComment.visibility = android.view.View.VISIBLE
                btnMoreComment.setOnClickListener { view ->
                    val popup = androidx.appcompat.widget.PopupMenu(view.context, view)
                    popup.menu.add("Edit")
                    popup.menu.add("Delete")
                    popup.setOnMenuItemClickListener { menuItem ->
                        when (menuItem.title) {
                            "Edit" -> {
                                onEditClick(comment)
                                true
                            }
                            "Delete" -> {
                                onDeleteClick(comment)
                                true
                            }
                            else -> false
                        }
                    }
                    popup.show()
                }
            } else {
                btnMoreComment.visibility = android.view.View.GONE
            }
        }
    }

    override fun getItemCount() = comments.size

    fun updateComments(newComments: List<Comment>) {
        comments = newComments
        notifyDataSetChanged()
    }
}