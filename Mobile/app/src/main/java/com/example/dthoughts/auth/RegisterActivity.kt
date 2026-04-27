package com.example.dthoughts.auth

import com.example.dthoughts.R

import com.example.dthoughts.profile.UserRepository

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.dthoughts.databinding.ActivityRegisterBinding
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var userRepository: UserRepository
    private var currentStep = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userRepository = UserRepository(this)

        updateStepUI()
        setupListeners()
    }

    private fun setupListeners() {
        binding.tvBackLogin.setOnClickListener {
            finish()
        }

        binding.tvGoLogin.setOnClickListener {
            finish()
        }

        binding.btnContinue.setOnClickListener {
            if (validateStep0()) {
                currentStep = 1
                updateStepUI()
            }
        }

        binding.btnBack.setOnClickListener {
            currentStep = 0
            updateStepUI()
        }

        binding.btnCreateAccount.setOnClickListener {
            if (validateStep1()) {
                handleRegistration()
            }
        }

        binding.etPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updatePasswordStrength(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.tvErrorClose.setOnClickListener {
            hideError()
        }
    }

    private fun updateStepUI() {
        if (currentStep == 0) {
            binding.step0Container.visibility = View.VISIBLE
            binding.step1Container.visibility = View.GONE
            
            binding.step1Badge.setBackgroundResource(R.drawable.bg_step_active)
            binding.step2Badge.setBackgroundResource(R.drawable.bg_step_inactive)
        } else {
            binding.step0Container.visibility = View.GONE
            binding.step1Container.visibility = View.VISIBLE

            binding.step1Badge.setBackgroundResource(R.drawable.bg_step_completed)
            binding.step2Badge.setBackgroundResource(R.drawable.bg_step_active)
        }
    }

    private fun validateStep0(): Boolean {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirm.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            showError("Please fill in all fields")
            return false
        }
        if (password != confirmPassword) {
            showError("Passwords do not match")
            return false
        }
        if (password.length < 6) {
            showError("Password must be at least 6 characters")
            return false
        }
        hideError()
        return true
    }

    private fun validateStep1(): Boolean {
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val termsAccepted = binding.cbTerms.isChecked

        if (firstName.isEmpty() || lastName.isEmpty()) {
            showError("Please enter your name")
            return false
        }
        if (!termsAccepted) {
            showError("You must accept the terms")
            return false
        }
        hideError()
        return true
    }

    private fun updatePasswordStrength(password: String) {
        val strength = when {
            password.isEmpty() -> 0
            password.length < 6 -> 1
            password.any { it.isDigit() } && password.any { it.isUpperCase() } -> 3
            else -> 2
        }

        val colorRes = when (strength) {
            1 -> R.color.rose_red
            2 -> R.color.amber_dark
            3 -> R.color.success_green
            else -> R.color.muted_soft
        }
        
        val color = ContextCompat.getColor(this, colorRes)
        val mutedColor = ContextCompat.getColor(this, R.color.muted_soft)

        binding.strengthRow.visibility = if (password.isEmpty()) View.GONE else View.VISIBLE
        binding.seg1.setBackgroundColor(if (strength >= 1) color else mutedColor)
        binding.seg2.setBackgroundColor(if (strength >= 2) color else mutedColor)
        binding.seg3.setBackgroundColor(if (strength >= 3) color else mutedColor)
    }

    private fun handleRegistration() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()

        setLoading(true)
        hideError()

        lifecycleScope.launch {
            val result = userRepository.register(email, password, firstName, lastName)
            setLoading(false)

            result.onSuccess {
                Toast.makeText(this@RegisterActivity, "Registration successful! Please login.", Toast.LENGTH_SHORT).show()
                finish()
            }.onFailure {
                showError(it.message ?: "Registration failed")
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnContinue.isEnabled = !isLoading
        binding.btnCreateAccount.isEnabled = !isLoading
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