package com.example.dthoughts.auth

import com.example.dthoughts.profile.UserRepository

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityForgotPasswordBinding
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding
    private lateinit var userRepository: UserRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userRepository = UserRepository(this)

        setupListeners()
    }

    private fun setupListeners() {
        binding.tvBack.setOnClickListener {
            finish()
        }

        binding.btnSubmit.setOnClickListener {
            handleResetRequest()
        }
    }

    private fun handleResetRequest() {
        val email = binding.etEmail.text.toString().trim()

        if (email.isEmpty()) {
            showError("Please enter your email address")
            return
        }

        setLoading(true)
        hideError()
        binding.layoutSuccess.visibility = View.GONE

        lifecycleScope.launch {
            val result = userRepository.forgotPassword(email)
            setLoading(false)

            result.onSuccess {
                binding.layoutSuccess.visibility = View.VISIBLE
                binding.btnSubmit.isEnabled = false
                Toast.makeText(this@ForgotPasswordActivity, "Reset link sent!", Toast.LENGTH_SHORT).show()
            }.onFailure {
                showError(it.message ?: "Failed to send reset email")
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnSubmit.isEnabled = !isLoading
        binding.btnSubmit.text = if (isLoading) "Sending..." else "Send Reset Link"
    }

    private fun showError(message: String) {
        binding.bannerError.visibility = View.VISIBLE
        binding.tvErrorMsg.text = message
    }

    private fun hideError() {
        binding.bannerError.visibility = View.GONE
    }
}
