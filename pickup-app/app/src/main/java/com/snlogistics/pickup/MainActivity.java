package com.snlogistics.pickup;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.WindowManager;
import android.webkit.*;

/** SN Pickup: the pickup app for HHTs and phones. The screens live at naveen5531.github.io/pickup, so every change
 *  reaches the device the next time it opens, without reinstalling. This shell adds what a web page cannot do alone:
 *  the camera for barcode scanning, and printing 4 x 6 inch box labels through Android's print service. */
public class MainActivity extends Activity {
    static final String HOME = "https://naveen5531.github.io/pickup/";
    static final int CAM_REQ = 41, LOC_REQ = 42, FILE_REQ = 43;
    private ValueCallback<Uri[]> fileCb;
    private GeolocationPermissions.Callback geoCb; private String geoOrigin;
    private WebView web;
    private PermissionRequest pending;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " SNPickup/1.0");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("intent".equals(u.getScheme())) { try { startActivity(Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME)); } catch (Exception ignored) {} return true; }
                if ("https".equals(u.getScheme()) && "naveen5531.github.io".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) {
                    // no internet and nothing cached: try the cached copy, else a simple retry screen
                    v.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                    v.loadData("<html><body style='font:16px sans-serif;padding:40px 24px;color:#101828'><h2>SN Pickup</h2><p>No internet connection.</p><p><button onclick='location.href=\"" + HOME + "\"' style='padding:14px 22px;border:0;border-radius:99px;background:#0c9b76;color:#fff;font-weight:700;font-size:16px'>Try again</button></p></body></html>", "text/html", "utf-8");
                }
            }
        });
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOC_REQ);
        web.setWebChromeClient(new WebChromeClient() {
            /** pickup location (proof of pickup) */
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) cb.invoke(origin, true, false);
                else { geoCb = cb; geoOrigin = origin; requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOC_REQ); }
            }
            /** photo of the boxes / invoice: opens the camera or gallery */
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try { Intent i = params.createIntent(); i.addCategory(Intent.CATEGORY_OPENABLE); startActivityForResult(Intent.createChooser(i, "Photo"), FILE_REQ); }
                catch (Exception e) { fileCb = null; return false; }
                return true;
            }
            @Override public void onPermissionRequest(PermissionRequest r) {
                runOnUiThread(() -> {
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) r.grant(r.getResources());
                    else { pending = r; requestPermissions(new String[]{Manifest.permission.CAMERA}, CAM_REQ); }
                });
            }
        });
        web.addJavascriptInterface(new Bridge(), "SNPickup");
        web.loadUrl(HOME);
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == FILE_REQ && fileCb != null) { fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data)); fileCb = null; }
    }

    @Override public void onRequestPermissionsResult(int code, String[] p, int[] res) {
        if (code == LOC_REQ && geoCb != null) { geoCb.invoke(geoOrigin, res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED, false); geoCb = null; }
        if (code == CAM_REQ && pending != null) {
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) pending.grant(pending.getResources()); else pending.deny();
            pending = null;
        }
    }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }

    /** Called from the page as window.SNPickup.* */
    class Bridge {
        @JavascriptInterface public boolean camOk() { return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED; }
        @JavascriptInterface public void askCam() { runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.CAMERA}, CAM_REQ)); }
        /** Box labels: Android's print screen with a 4 x 6 inch page, ready for a thermal label printer (or Save as PDF). */
        @JavascriptInterface public void print(final String name) {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                PrintAttributes at = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.NA_INDEX_4X6)
                        .setColorMode(PrintAttributes.COLOR_MODE_MONOCHROME)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS).build();
                pm.print(name, web.createPrintDocumentAdapter(name), at);
            });
        }
        @JavascriptInterface public String version() { return "1.2"; }
        /** open a page in Chrome (Google sign-in is not allowed inside app web views) */
        @JavascriptInterface public void openExternal(String url) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                i.setPackage("com.android.chrome");
                try { startActivity(i); } catch (Exception e) { try { startActivity(i.setPackage(null)); } catch (Exception ignored) {} }
            });
        }
    }
}
