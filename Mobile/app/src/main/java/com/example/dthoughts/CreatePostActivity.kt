package com.example.dthoughts

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityCreatePostBinding
import com.example.dthoughts.network.RetrofitClient
import com.example.dthoughts.repository.PostRepository
import com.example.dthoughts.utils.UserPrefs
import com.google.android.material.chip.Chip
import kotlinx.coroutines.launch
import kotlin.jvm.java

class CreatePostActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCreatePostBinding
    private val postRepository = PostRepository(RetrofitClient.apiService)
    private var selectedMood: String? = null
    private var imageUri: Uri? = null

    private val moods = listOf(
        "Happy" to "😊",
        "Reflective" to "🤔",
        "Sad" to "😢",
        "Motivated" to "💪",
        "Peaceful" to "😌",
        "Frustrated" to "😤",
        "Excited" to "🎉",
        "Tired" to "😴"
    )

    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            imageUri = it
            binding.ivPreview.setImageURI(it)
            binding.previewLayout.visibility = View.VISIBLE
            binding.dropZone.visibility = View.GONE
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreatePostBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupMoods()
        setupListeners()
        updateCharCount(0)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val draftId = intent?.getLongExtra("DRAFT_ID", -1) ?: -1
        if (draftId != -1L) {
            val content = intent?.getStringExtra("DRAFT_CONTENT")
            val title = intent?.getStringExtra("DRAFT_TITLE")
            val mood = intent?.getStringExtra("DRAFT_MOOD")
            
            binding.etPostContent.setText(content)
            // If you have a title field, set it here
            // If mood is provided, select the corresponding chip
            if (mood != null) {
                for (i in 0 until binding.moodChipGroup.childCount) {
                    val chip = binding.moodChipGroup.getChildAt(i) as Chip
                    if (chip.text.toString().contains(mood, ignoreCase = true)) {
                        chip.isChecked = true
                        break
                    }
                }
            }
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { 
            val intent = Intent(this, FeedActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            finish()
        }
    }

    private fun setupMoods() {
        moods.forEach { (label, emoji) ->
            val chip = Chip(this).apply {
                text = "$emoji $label"
                isCheckable = true
                setChipBackgroundColorResource(R.color.feed_surface)
                setTextColor(ContextCompat.getColor(this@CreatePostActivity, R.color.feed_muted))
                setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) {
                        selectedMood = label
                        setChipBackgroundColorResource(R.color.feed_amber_pale)
                        setTextColor(ContextCompat.getColor(this@CreatePostActivity, R.color.feed_amber_dark))
                    } else {
                        if (selectedMood == label) selectedMood = null
                        setChipBackgroundColorResource(R.color.feed_surface)
                        setTextColor(ContextCompat.getColor(this@CreatePostActivity, R.color.feed_muted))
                    }
                }
            }
            binding.moodChipGroup.addView(chip)
        }
    }

    private fun setupListeners() {
        binding.etPostContent.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updateCharCount(s?.length ?: 0)
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.dropZone.setOnClickListener {
            pickImage.launch("image/*")
        }

        binding.btnRemoveImage.setOnClickListener {
            imageUri = null
            binding.previewLayout.visibility = View.GONE
            binding.dropZone.visibility = View.VISIBLE
        }

        binding.btnCancel.setOnClickListener { 
            val intent = Intent(this, FeedActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            startActivity(intent)
            finish()
        }

        binding.btnPublish.setOnClickListener { publishPost() }

        binding.btnSaveDraft.setOnClickListener {
            val content = binding.etPostContent.text.toString().trim()
            if (content.isNotEmpty()) {
                // simple title extract
                val title = if (content.length > 20) content.substring(0, 20) + "..." else content
                com.example.dthoughts.utils.DraftManager.saveDraft(content, title, selectedMood)
                Toast.makeText(this, "Thought saved to Drafts", Toast.LENGTH_SHORT).show()
            }
            finish()
        }
    }

    private fun updateCharCount(count: Int) {
        binding.tvCharCount.text = "$count / 500"
        if (count > 500) {
            binding.tvCharCount.setTextColor(ContextCompat.getColor(this, R.color.rose))
            binding.btnPublish.isEnabled = false
        } else {
            binding.tvCharCount.setTextColor(ContextCompat.getColor(this, R.color.feed_muted))
            binding.btnPublish.isEnabled = count > 0
        }
    }

    private fun publishPost() {
        val content = binding.etPostContent.text.toString().trim()
        if (content.isEmpty()) return

        val user = UserPrefs.getUser()
        if (user == null) {
            Toast.makeText(this, "Session expired, please login again.", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            binding.btnPublish.isEnabled = false
            
            val result = if (imageUri != null) {
                val inputStream = contentResolver.openInputStream(imageUri!!)
                val fileData = inputStream?.readBytes() ?: byteArrayOf()
                inputStream?.close()
                val fileName = "post_image_${System.currentTimeMillis()}.jpg"
                postRepository.createPostWithImage(user.id, content, selectedMood, fileData, fileName)
            } else {
                postRepository.createPost(user.id, content, selectedMood)
            }
            
            if (result.isSuccess) {
                Toast.makeText(this@CreatePostActivity, "Thought published!", Toast.LENGTH_SHORT).show()
                setResult(Activity.RESULT_OK)
                finish()
            } else {
                binding.btnPublish.isEnabled = true
                Toast.makeText(this@CreatePostActivity, "Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
