package com.example.dthoughts.profile

import com.example.dthoughts.R


import com.example.dthoughts.core.RetrofitClient
import com.example.dthoughts.core.UserPrefs

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.example.dthoughts.databinding.ActivityEditProfileBinding
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

class EditProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEditProfileBinding
    private val apiService = RetrofitClient.apiService
    private var avatarUri: Uri? = null
    private var coverUri: Uri? = null

    private val pickAvatar = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            avatarUri = it
            binding.ivEditAvatar.setImageURI(it)
        }
    }

    private val pickCover = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            coverUri = it
            binding.ivEditCover.setImageURI(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        loadCurrentData()

        binding.cardAvatar.setOnClickListener { pickAvatar.launch("image/*") }
        binding.cardCover.setOnClickListener { pickCover.launch("image/*") }
        binding.btnSave.setOnClickListener {
            saveProfile()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowTitleEnabled(false)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }

    private fun loadCurrentData() {
        val user = UserPrefs.getUser() ?: return
        binding.etFirstName.setText(user.firstName)
        binding.etLastName.setText(user.lastName)
        binding.etBio.setText(user.bio)

        val baseUrl = RetrofitClient.BASE_URL.removeSuffix("/")
        
        if (!user.avatarUrl.isNullOrEmpty()) {
            val avatarUrl = if (user.avatarUrl.startsWith("http")) user.avatarUrl else "$baseUrl${user.avatarUrl}"
            Glide.with(this).load(avatarUrl).placeholder(R.drawable.ic_profile_holder).into(binding.ivEditAvatar)
        }
        
        if (!user.coverImageUrl.isNullOrEmpty()) {
            val coverUrl = if (user.coverImageUrl.startsWith("http")) user.coverImageUrl else "$baseUrl${user.coverImageUrl}"
            Glide.with(this).load(coverUrl).placeholder(R.color.feed_surface).into(binding.ivEditCover)
        }
    }

    private fun saveProfile() {
        val user = UserPrefs.getUser() ?: return
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val bio = binding.etBio.text.toString().trim()

        if (firstName.isEmpty() || lastName.isEmpty()) {
            Toast.makeText(this, "Name cannot be empty", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSave.isEnabled = false

        lifecycleScope.launch {
            try {
                // 1. Update basic info
                val request = UpdateUserRequest(user.email, firstName, lastName, bio)
                val response = apiService.updateUser(request)
                
                if (response.isSuccessful && response.body() != null) {
                    var updatedUser = response.body()!!
                    
                    // 2. Upload avatar if selected
                    avatarUri?.let { uri ->
                        val inputStream = contentResolver.openInputStream(uri)
                        val bytes = inputStream?.readBytes()
                        inputStream?.close()
                        if (bytes != null) {
                            val body = bytes.toRequestBody("image/*".toMediaTypeOrNull())
                            val part = MultipartBody.Part.createFormData("file", "avatar.jpg", body)
                            val avatarResponse = apiService.uploadAvatar(user.email, part)
                            if (avatarResponse.isSuccessful && avatarResponse.body() != null) {
                                updatedUser = avatarResponse.body()!!
                            }
                        }
                    }

                    // 3. Upload cover if selected
                    coverUri?.let { uri ->
                        val inputStream = contentResolver.openInputStream(uri)
                        val bytes = inputStream?.readBytes()
                        inputStream?.close()
                        if (bytes != null) {
                            val body = bytes.toRequestBody("image/*".toMediaTypeOrNull())
                            val part = MultipartBody.Part.createFormData("file", "cover.jpg", body)
                            val coverResponse = apiService.uploadCover(user.email, part)
                            if (coverResponse.isSuccessful && coverResponse.body() != null) {
                                updatedUser = coverResponse.body()!!
                            }
                        }
                    }

                    UserPrefs.saveUser(updatedUser)
                    Toast.makeText(this@EditProfileActivity, "Profile updated", Toast.LENGTH_SHORT).show()
                    setResult(RESULT_OK)
                    finish()
                } else {
                    Toast.makeText(this@EditProfileActivity, "Update failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@EditProfileActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnSave.isEnabled = true
            }
        }
    }
}

