package com.example.dthoughts

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
import com.example.dthoughts.repository.UserRepository
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private lateinit var userRepository: UserRepository
    private var currentStep = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userRepository = UserRepository(this)

        updateStepUI()
        setupListeners()
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            if (currentStep > 1) {
                currentStep--
                updateStepUI()
            } else {
                finish()
            }
        }

        binding.btnNextStep.setOnClickListener {
            if (currentStep == 1) {
                if (validateStep1()) {
                    currentStep = 2
                    updateStepUI()
                }
            } else {
                if (validateStep2()) {
                    handleRegistration()
                }
            }
        }

        binding.etPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                updatePasswordStrength(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.tvLoginLink.setOnClickListener {
            finish()
        }
    }

    private fun updateStepUI() {
        if (currentStep == 1) {
            binding.layoutStep1.visibility = View.VISIBLE
            binding.layoutStep2.visibility = View.GONE
            binding.btnNextStep.text = getString(R.string.btn_next)
            
            binding.viewStep1Circle.setBackgroundResource(R.drawable.bg_step_active)
            binding.viewStep2Circle.setBackgroundResource(R.drawable.bg_step_inactive)
        } else {
            binding.layoutStep1.visibility = View.GONE
            binding.layoutStep2.visibility = View.VISIBLE
            binding.btnNextStep.text = getString(R.string.btn_register)

            binding.viewStep1Circle.setBackgroundResource(R.drawable.bg_step_completed)
            binding.viewStep2Circle.setBackgroundResource(R.drawable.bg_step_active)
        }
    }

    private fun validateStep1(): Boolean {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return false
        }
        if (password != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return false
        }
        if (password.length < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
            return false
        }
        return true
    }

    private fun validateStep2(): Boolean {
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()
        val termsAccepted = binding.cbTerms.isChecked

        if (firstName.isEmpty() || lastName.isEmpty()) {
            Toast.makeText(this, "Please enter your name", Toast.LENGTH_SHORT).show()
            return false
        }
        if (!termsAccepted) {
            Toast.makeText(this, "You must accept the terms", Toast.LENGTH_SHORT).show()
            return false
        }
        return true
    }

    private fun updatePasswordStrength(password: String) {
        val strength = when {
            password.isEmpty() -> 0
            password.length < 6 -> 1
            password.any { it.isDigit() } && password.any { it.isUpperCase() } -> 3
            else -> 2
        }

        val color = when (strength) {
            1 -> R.color.rose_red
            2 -> R.color.amber_dark
            3 -> R.color.success_green
            else -> R.color.muted_soft
        }

        binding.viewStrengthSeg1.setBackgroundColor(if (strength >= 1) ContextCompat.getColor(this, color) else ContextCompat.getColor(this, R.color.muted_soft))
        binding.viewStrengthSeg2.setBackgroundColor(if (strength >= 2) ContextCompat.getColor(this, color) else ContextCompat.getColor(this, R.color.muted_soft))
        binding.viewStrengthSeg3.setBackgroundColor(if (strength >= 3) ContextCompat.getColor(this, color) else ContextCompat.getColor(this, R.color.muted_soft))
    }

    private fun handleRegistration() {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val firstName = binding.etFirstName.text.toString().trim()
        val lastName = binding.etLastName.text.toString().trim()

        setLoading(true)

        lifecycleScope.launch {
            val result = userRepository.register(email, password, firstName, lastName)
            setLoading(false)

            result.onSuccess {
                Toast.makeText(this@RegisterActivity, "Registration successful! Please login.", Toast.LENGTH_SHORT).show()
                finish()
            }.onFailure {
                Toast.makeText(this@RegisterActivity, it.message ?: "Registration failed", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setLoading(isLoading: Boolean) {
        binding.btnNextStep.isEnabled = !isLoading
        binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}