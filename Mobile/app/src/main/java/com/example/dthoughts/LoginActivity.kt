package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityLoginBinding
import com.example.dthoughts.repository.UserRepository
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var userRepository: UserRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userRepository = UserRepository(this)

        setupListeners()
    }

    private fun setupListeners() {
        binding.btnSignIn.setOnClickListener {
            handleLogin()
        }

        binding.tvForgotPassword.setOnClickListener {
            startActivity(Intent(this, ForgotPasswordActivity::class.java))
        }

        binding.tvGoRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.tvGuestContinue.setOnClickListener {
            startActivity(Intent(this, GuestFeedActivity::class.java))
            finish()
        }
    }

    private fun handleLogin() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            showError("Please enter email and password")
            return
        }

        setLoading(true)
        hideError()

        lifecycleScope.launch {
            val result = userRepository.login(email, password)
            setLoading(false)

            result.onSuccess {
                Toast.makeText(this@LoginActivity, "Login successful!", Toast.LENGTH_SHORT).show()
                // Navigate to feed activity
                startActivity(Intent(this@LoginActivity, FeedActivity::class.java))
                finish()
            }.onFailure {
                showError(it.message ?: "Login failed")
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnSignIn.isEnabled = !isLoading
        // binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
    }

    private fun showError(message: String) {
        binding.bannerError.visibility = View.VISIBLE
        binding.tvErrorMsg.text = message
    }

    private fun hideError() {
        binding.bannerError.visibility = View.GONE
    }
}