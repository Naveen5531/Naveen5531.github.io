package com.snlogistics.pickup;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

/** Driver trip: keeps sending the phone's position to the SN Pickup page while a trip runs, also when the app is in
 *  the background or the screen is off. The page saves it for the portal's live map. Runs only between Start trip
 *  and End trip, with a notification, and stops by itself when the trip ends. */
public class TripService extends Service implements LocationListener {
    static final String CH = "trip", EXTRA = "label";
    static boolean running;
    private LocationManager lm;
    private final Handler h = new Handler(Looper.getMainLooper());

    static void start(Context c, String label) {
        Intent i = new Intent(c, TripService.class).putExtra(EXTRA, label == null ? "" : label);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
    }
    static void stop(Context c) { c.stopService(new Intent(c, TripService.class)); }

    @Override public int onStartCommand(Intent in, int flags, int id) {
        String label = in != null ? in.getStringExtra(EXTRA) : "";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(CH) == null)
            nm.createNotificationChannel(new NotificationChannel(CH, "Driver trip", NotificationManager.IMPORTANCE_LOW));
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        Notification n = b.setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("Trip running" + (label == null || label.isEmpty() ? "" : " · " + label))
                .setContentText("Sharing your location with the office. End the trip in SN Pickup.").setOngoing(true).setContentIntent(open).build();
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(7, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION); else startForeground(7, n);
        } catch (Exception e) { stopSelf(); return START_NOT_STICKY; }
        listen();
        running = true;
        return START_STICKY;
    }

    private void listen() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return;
        lm = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (lm == null) return;
        try { lm.removeUpdates(this); } catch (Exception ignored) {}
        try { if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 30000, 40, this, Looper.getMainLooper()); } catch (Exception ignored) {}
        try { if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 60000, 80, this, Looper.getMainLooper()); } catch (Exception ignored) {}
    }

    @Override public void onLocationChanged(Location l) {
        final String js = "window.__nativePos&&window.__nativePos(" + l.getLatitude() + "," + l.getLongitude() + "," + l.getAccuracy() + "," + (l.hasSpeed() ? l.getSpeed() : "null") + ")";
        h.post(() -> { try { if (MainActivity.web != null) MainActivity.web.evaluateJavascript(js, null); } catch (Exception ignored) {} });
    }
    @Override public void onStatusChanged(String p, int s, Bundle b) {}
    @Override public void onProviderEnabled(String p) { listen(); }
    @Override public void onProviderDisabled(String p) {}

    @Override public void onDestroy() { running = false; try { if (lm != null) lm.removeUpdates(this); } catch (Exception ignored) {} super.onDestroy(); }
    @Override public IBinder onBind(Intent i) { return null; }
}
