package com.example.dthoughts

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class GuestFeedActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // For now, just a simple layout with a button to go back to login
        val button = Button(this).apply {
            text = "Welcome Guest! Click to Login"
            setOnClickListener {
                startActivity(Intent(this@GuestFeedActivity, LoginActivity::class.java))
                finish()
            }
        }
        setContentView(button)
    }
}