package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.dthoughts.adapters.DraftAdapter
import com.example.dthoughts.databinding.ActivityDraftsBinding
import com.example.dthoughts.models.Draft
import com.example.dthoughts.utils.UserPrefs

class DraftsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDraftsBinding
    private lateinit var draftAdapter: DraftAdapter
    private val allDrafts = mutableListOf<Draft>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDraftsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        setupRecyclerView()
        loadDrafts()
    }

    private fun setupUI() {
        binding.bottomNav.selectedItemId = R.id.nav_saved
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    startActivity(Intent(this, FeedActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_notifications -> {
                    startActivity(Intent(this, NotificationsActivity::class.java))
                    finish()
                    true
                }
                R.id.nav_create -> {
                    startActivity(Intent(this, CreatePostActivity::class.java))
                    true
                }
                R.id.nav_saved -> true
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

        binding.btnNewThought.setOnClickListener {
            startActivity(Intent(this, CreatePostActivity::class.java))
        }

        binding.btnContinueWritingEmpty.setOnClickListener {
            startActivity(Intent(this, CreatePostActivity::class.java))
        }
    }

    private fun setupRecyclerView() {
        draftAdapter = DraftAdapter(
            drafts = allDrafts,
            onContinueClick = { draft -> 
                val intent = Intent(this, CreatePostActivity::class.java).apply {
                    putExtra("DRAFT_ID", draft.id.toLong())
                    putExtra("DRAFT_CONTENT", draft.content)
                    putExtra("DRAFT_TITLE", draft.title)
                    putExtra("DRAFT_MOOD", draft.mood)
                }
                startActivity(intent)
            },
            onDeleteClick = { draft ->
                val index = allDrafts.indexOf(draft)
                if (index != -1) {
                    com.example.dthoughts.utils.DraftManager.deleteDraft(draft.id)
                    allDrafts.removeAt(index)
                    draftAdapter.notifyItemRemoved(index)
                    updateEmptyState()
                }
            }
        )
        binding.rvDrafts.layoutManager = LinearLayoutManager(this)
        binding.rvDrafts.adapter = draftAdapter
    }

    private fun loadDrafts() {
        binding.tvLoading.visibility = View.VISIBLE
        
        val savedDrafts = com.example.dthoughts.utils.DraftManager.getDrafts()

        binding.tvLoading.visibility = View.GONE
        allDrafts.clear()
        allDrafts.addAll(savedDrafts)
        draftAdapter.notifyDataSetChanged()
        updateEmptyState()
    }

    private fun updateEmptyState() {
        if (allDrafts.isEmpty()) {
            binding.layoutEmpty.visibility = View.VISIBLE
            binding.rvDrafts.visibility = View.GONE
        } else {
            binding.layoutEmpty.visibility = View.GONE
            binding.rvDrafts.visibility = View.VISIBLE
        }
    }
}