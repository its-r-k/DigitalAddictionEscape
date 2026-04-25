package com.digitaladdiction.escapegame

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * MainActivity — Single-activity host for the WebView-based game.
 *
 * The game runs entirely from local assets (assets/index.html).
 * No internet permission is required; all resources are bundled.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            // JavaScript must be enabled for the game state machine to run.
            javaScriptEnabled = true

            // Allow file:// URLs to access other file:// resources in the
            // same origin (needed for loading styles.css and game.js from
            // index.html when served from the assets directory).
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = false

            // Sensible defaults for a text-heavy game
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_NO_CACHE
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)

            // Use a wide viewport so the CSS max-width layout is respected
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // Prevent navigation away from the game (no external links)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                // Only allow file:// scheme — block any external URL attempts
                return !request.url.scheme.equals("file", ignoreCase = true)
            }
        }

        // Load the game from bundled assets
        webView.loadUrl("file:///android_asset/index.html")
    }

    /** Allow the system back button to navigate within WebView history. */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
