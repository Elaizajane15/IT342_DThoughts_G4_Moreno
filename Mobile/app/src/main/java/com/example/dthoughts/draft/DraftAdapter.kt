package com.example.dthoughts.draft

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.dthoughts.databinding.ItemDraftBinding

class DraftAdapter(
    private var drafts: List<Draft>,
    private val onContinueClick: (Draft) -> Unit,
    private val onDeleteClick: (Draft) -> Unit
) : RecyclerView.Adapter<DraftAdapter.DraftViewHolder>() {

    class DraftViewHolder(val binding: ItemDraftBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DraftViewHolder {
        val binding = ItemDraftBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return DraftViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DraftViewHolder, position: Int) {
        val draft = drafts[position]
        with(holder.binding) {
            tvDraftTitle.text = draft.title ?: "Untitled"
            tvDraftContent.text = draft.content
            tvDraftSavedAt.text = "Last saved: ${draft.savedAt}"
            
            if (!draft.mood.isNullOrEmpty()) {
                tvDraftMood.visibility = android.view.View.VISIBLE
                tvDraftMood.text = draft.mood
            } else {
                tvDraftMood.visibility = android.view.View.GONE
            }

            btnContinueWriting.setOnClickListener { onContinueClick(draft) }
            btnDeleteDraft.setOnClickListener { onDeleteClick(draft) }
        }
    }

    override fun getItemCount() = drafts.size

    fun updateDrafts(newDrafts: List<Draft>) {
        this.drafts = newDrafts
        notifyDataSetChanged()
    }
}