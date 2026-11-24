package com.kphube.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (this.bridge != null) {
            this.bridge.setWebViewClient(new BridgeWebViewClient(this.bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    if (uri != null && handleUpiOrExternalUri(uri)) {
                        return true;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });
        }
    }

    private boolean handleUpiOrExternalUri(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null) {
            return false;
        }
        String lower = scheme.toLowerCase();

        if (lower.equals("intent")) {
            try {
                Intent parsedIntent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
                try {
                    startActivity(parsedIntent);
                    return true;
                } catch (ActivityNotFoundException ex) {
                    String query = uri.getEncodedQuery();
                    if (query != null && !query.isEmpty()) {
                        launchGenericUpi(query);
                    }
                    return true;
                }
            } catch (Exception ignored) {
                return true;
            }
        }

        if (
            lower.equals("upi") ||
            lower.equals("phonepe") ||
            lower.equals("tez") ||
            lower.equals("gpay") ||
            lower.equals("paytmmp") ||
            lower.equals("paytm")
        ) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                if (lower.equals("upi")) {
                    startActivity(Intent.createChooser(intent, "Pay using UPI App"));
                } else {
                    startActivity(intent);
                }
            } catch (ActivityNotFoundException ex) {
                String query = uri.getEncodedQuery();
                if (query != null && !query.isEmpty() && !lower.equals("upi")) {
                    launchGenericUpi(query);
                }
            }
            return true;
        }

        return false;
    }

    private void launchGenericUpi(String encodedQuery) {
        try {
            Uri genericUri = Uri.parse("upi://pay?" + encodedQuery);
            Intent fallback = new Intent(Intent.ACTION_VIEW, genericUri);
            startActivity(Intent.createChooser(fallback, "Choose Installed UPI App"));
        } catch (Exception ignored) {
            // No UPI app installed on device
        }
    }
}
