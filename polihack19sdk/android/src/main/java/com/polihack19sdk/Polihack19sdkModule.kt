package com.polihack19sdk

import com.facebook.react.bridge.ReactApplicationContext

class Polihack19sdkModule(reactContext: ReactApplicationContext) :
  NativePolihack19sdkSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativePolihack19sdkSpec.NAME
  }
}
