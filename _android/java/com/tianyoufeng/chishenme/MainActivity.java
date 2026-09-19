package com.tianyoufeng.chishenme;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 今天吃什么 · 本地壳
 * 设计：页面跑在自造 https 源（app.local）下（IndexedDB 可用、origin 稳定），
 * shouldInterceptRequest 把该源的所有请求映射到 APK assets。零网络请求、零权限。
 */
public class MainActivity extends Activity {

    private static final String APP_HOST = "app.local";
    private static final String APP_URL = "https://" + APP_HOST + "/index.html";

    private WebView web;
    private int loadStage = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                return serveAsset(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                return !APP_HOST.equals(req.getUrl().getHost());
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, android.webkit.WebResourceError err) {
                if (!req.isForMainFrame()) return;
                if (loadStage == 0) {
                    loadStage = 1;
                    web.postDelayed(new Runnable() {
                        @Override public void run() { web.loadUrl(APP_URL); }
                    }, 300);
                } else {
                    loadStage = 2;
                    showDiag(String.valueOf(err.getErrorCode()), String.valueOf(err.getDescription()));
                }
            }
        });

        web.loadUrl(APP_URL);
    }

    /** https://app.local/* → assets/* */
    private WebResourceResponse serveAsset(android.net.Uri url) {
        if (url == null || !APP_HOST.equals(url.getHost())) return null;
        String path = url.getPath();
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        if (path.startsWith("/")) path = path.substring(1);
        if (path.contains("..") || path.indexOf('\\') >= 0) return notFound();
        InputStream in;
        try { in = getAssets().open(path); } catch (IOException e) { return notFound(); }
        String mime = mimeOf(path);
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Access-Control-Allow-Origin", "*");
        String charset = charsetOf(mime);
        return new WebResourceResponse(mime, charset, 200, "OK", headers, in);
    }

    private WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null,
                new ByteArrayInputStream(new byte[0]));
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private static String charsetOf(String mime) {
        if (mime.startsWith("text/") || mime.contains("javascript")
                || mime.contains("json") || mime.contains("svg")) return "utf-8";
        return null;
    }

    /** 主文档彻底失败时的可读诊断页（三级降级第 2 级） */
    private void showDiag(String code, String desc) {
        String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>body{font-family:sans-serif;background:#F8F5F0;color:#1F1E1B;"
                + "display:flex;align-items:center;justify-content:center;height:100vh;margin:0}"
                + "div{text-align:center;padding:24px}code{color:#C9552A}</style></head>"
                + "<body><div><h2>加载失败</h2><p>请截图并反馈</p><p><code>"
                + code + " / " + desc + "</code></p>"
                + "<button onclick='location.reload()' style='padding:10px 24px;"
                + "background:#E8703A;color:#fff;border:0;border-radius:12px'>重试</button>"
                + "</div></body></html>";
        web.loadDataWithBaseURL(APP_URL, html, "text/html", "utf-8", APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            // 只在 app.local 域内回退（前端路由），外部链接直接交给系统
            web.evaluateJavascript("(function(){try{return location.host==='app.local'}catch(e){return false}})()",
                    new android.webkit.ValueCallback<String>() {
                        @Override public void onReceiveValue(String v) {
                            if ("true".equals(v) && web.canGoBack()
                                    && !web.getUrl().equals(APP_URL)) web.goBack();
                        }
                    });
        } else {
            super.onBackPressed();
        }
    }
}
