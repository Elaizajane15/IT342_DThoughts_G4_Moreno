package com.example.dthoughts.auth

import com.example.dthoughts.profile.UserRepository

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityResetPasswordBinding
import kotlinx.coroutines.launch

class ResetPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResetPasswordBinding
    private lateinit var userRepository: UserRepository
    private var token: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResetPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userRepository = UserRepository(this)
        
        // Handle deep link or intent extra for token
        token = intent.data?.getQueryParameter("token") ?: intent.getStringExtra("token")

        if (token == null) {
            Toast.makeText(this, "Invalid reset link", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        setupListeners()
    }

    private fun setupListeners() {
        binding.tvBack.setOnClickListener {
            finish()
        }

        binding.btnReset.setOnClickListener {
            handleReset()
        }
    }

    private fun handleReset() {
        val newPassword = binding.etNewPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        if (newPassword.isEmpty()) {
            showError("Please enter a new password")
            return
        }

        if (newPassword.length < 6) {
            showError("Password must be at least 6 characters")
            return
        }

        if (newPassword != confirmPassword) {
            showError("Passwords do not match")
            return
        }

        setLoading(true)
        hideError()

        lifecycleScope.launch {
            val result = userRepository.resetPassword(token!!, newPassword)
            setLoading(false)

            result.onSuccess {
                Toast.makeText(this@ResetPasswordActivity, "Password reset successful!", Toast.LENGTH_LONG).show()
                val intent = Intent(this@ResetPasswordActivity, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
            }.onFailure {
                showError(it.message ?: "Failed to reset password")
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnReset.isEnabled = !isLoading
        binding.btnReset.text = if (isLoading) "Resetting..." else "Reset Password"
    }

    private fun showError(message: String) {
        binding.bannerError.visibility = View.VISIBLE
        binding.tvErrorMsg.text = message
    }

    private fun hideError() {
        binding.bannerError.visibility = View.GONE
    }
}
