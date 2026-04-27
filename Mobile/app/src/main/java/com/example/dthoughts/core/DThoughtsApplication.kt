package com.example.dthoughts.core

import com.example.dthoughts.notification.Notification
import com.example.dthoughts.notification.NotificationHelper
import com.example.dthoughts.draft.DraftManager

import android.app.Application

class DThoughtsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize UserPrefs and DraftManager with application context
        UserPrefs.init(this)
        com.example.dthoughts.draft.DraftManager.init(this)
        
        // Initialize Notification Channel
        com.example.dthoughts.notification.NotificationHelper.createNotificationChannel(this)
    }
}