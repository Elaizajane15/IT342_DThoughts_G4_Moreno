package com.example.dthoughts

import android.app.Application
import com.example.dthoughts.utils.UserPrefs

class DThoughtsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize UserPrefs and DraftManager with application context
        UserPrefs.init(this)
        com.example.dthoughts.utils.DraftManager.init(this)
        
        // Initialize Notification Channel
        com.example.dthoughts.utils.NotificationHelper.createNotificationChannel(this)
    }
}