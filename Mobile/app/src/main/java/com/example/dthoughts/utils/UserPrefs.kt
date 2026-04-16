package com.example.dthoughts.utils

import android.content.Context
import android.content.SharedPreferences
import com.example.dthoughts.models.User
import com.google.gson.Gson

object UserPrefs {
    private const val PREFS_NAME = "UserPrefs"
    private const val KEY_TOKEN = "auth_token"
    private const val KEY_USER = "user_info"
    private const val KEY_IS_LOGGED_IN = "is_logged_in"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveUser(user: User) {
        val userJson = gson.toJson(user)
        prefs.edit().putString(KEY_USER, userJson)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    fun getUser(): User? {
        val userJson = prefs.getString(KEY_USER, null)
        return if (userJson != null) gson.fromJson(userJson, User::class.java) else null
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clear() {
        prefs.edit().clear().apply()
    }
}