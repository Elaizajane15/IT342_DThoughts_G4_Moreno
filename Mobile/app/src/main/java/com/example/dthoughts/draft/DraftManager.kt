package com.example.dthoughts.draft

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.text.SimpleDateFormat
import java.util.*

object DraftManager {
    private const val PREFS_NAME = "DraftPrefs"
    private const val KEY_DRAFTS = "draft_list"

    private lateinit var prefs: SharedPreferences
    private val gson = Gson()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveDraft(content: String, title: String? = null, mood: String? = null) {
        val drafts = getDrafts().toMutableList()
        val dateFormat = SimpleDateFormat("MMM dd, hh:mm a", Locale.getDefault())
        val dateString = dateFormat.format(Date())
        
        val newDraft = Draft(
            id = System.currentTimeMillis(),
            title = title,
            content = content,
            mood = mood,
            savedAt = dateString
        )
        
        drafts.add(0, newDraft) // Add to top
        saveDraftsList(drafts)
    }

    fun deleteDraft(draftId: Long) {
        val drafts = getDrafts().toMutableList()
        drafts.removeAll { it.id == draftId }
        saveDraftsList(drafts)
    }

    fun getDrafts(): List<Draft> {
        val json = prefs.getString(KEY_DRAFTS, null) ?: return emptyList()
        val type = object : TypeToken<List<Draft>>() {}.type
        return gson.fromJson(json, type)
    }

    private fun saveDraftsList(drafts: List<Draft>) {
        val json = gson.toJson(drafts)
        prefs.edit().putString(KEY_DRAFTS, json).apply()
    }
}
