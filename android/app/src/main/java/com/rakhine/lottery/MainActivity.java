package com.rakhine.lottery;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        this.bridge.getWebView().setVerticalScrollBarEnabled(false);
        this.bridge.getWebView().setHorizontalScrollBarEnabled(false);
    }
}
