package com.example.dthoughts

import android.app.Application
import com.example.dthoughts.utils.UserPrefs

class DThoughtsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize UserPrefs with application context
        UserPrefs.init(this)
    }
}