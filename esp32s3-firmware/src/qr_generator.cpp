#include "qr_generator.h"
#include <stdio.h>
#include <string.h>
#include <mbedtls/md.h>
#include <Arduino.h>

#ifdef USE_HARDWARE_EFUSE_HMAC
#include <esp_hmac.h>
#endif

static char s_current_url[QR_URL_MAX_LEN] = {0};
static char s_current_sig[HM_16HEX_LEN] = {0};
static uint32_t s_current_ts = 0;
static uint32_t s_nonce_counter = 0;
static uint32_t s_last_rotation_tick = 0;

// Cached Derived Device Key (Calculated once from Master Secret Key)
static uint8_t s_device_key_bytes[32] = {0};
static bool s_device_key_initialized = false;

static void deriveDeviceKey(void) {
    if (s_device_key_initialized) return;

    const mbedtls_md_info_t* md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    if (!md_info) return;

    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, md_info, 1);
    mbedtls_md_hmac_starts(&ctx, (const unsigned char*)MASTER_SECRET_KEY, strlen(MASTER_SECRET_KEY));
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)CABINET_ID, strlen(CABINET_ID));
    mbedtls_md_hmac_finish(&ctx, s_device_key_bytes);
    mbedtls_md_free(&ctx);

    s_device_key_initialized = true;
}

void QrGenerator_Init(void) {
    memset(s_current_url, 0, sizeof(s_current_url));
    memset(s_current_sig, 0, sizeof(s_current_sig));
    s_current_ts = 0;
    s_nonce_counter = 0;
    s_last_rotation_tick = 0;

    deriveDeviceKey();
}

bool QrGenerator_ComputeSignature(const char* cab, uint32_t unix_time, uint32_t nonce, char* out_sig_16char) {
    if (!cab || !out_sig_16char) {
        return false;
    }

    char message[96];
    snprintf(message, sizeof(message), "%s:%lu:%lu", cab, (unsigned long)unix_time, (unsigned long)nonce);

    uint8_t hmac_result[32]; // SHA-256 32-byte digest

#ifdef USE_HARDWARE_EFUSE_HMAC
    // Production Mode: Dedicated Silicon Hardware HMAC using eFuse Block KEY4
    // Protected by eFuse read_protection against flash extraction
    esp_err_t err = esp_hmac_calculate(HMAC_KEY4, (const uint8_t*)message, strlen(message), hmac_result);
    if (err != ESP_OK) {
        return false;
    }
#else
    // Development/Test Mode: Software HMAC using Per-Device Derived Key
    if (!s_device_key_initialized) {
        deriveDeviceKey();
    }

    const mbedtls_md_info_t* md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    if (!md_info) {
        return false;
    }

    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    if (mbedtls_md_setup(&ctx, md_info, 1) != 0) {
        mbedtls_md_free(&ctx);
        return false;
    }

    mbedtls_md_hmac_starts(&ctx, s_device_key_bytes, 32);
    mbedtls_md_hmac_update(&ctx, (const unsigned char*)message, strlen(message));
    mbedtls_md_hmac_finish(&ctx, hmac_result);
    mbedtls_md_free(&ctx);
#endif

    // Format first 8 bytes into 16 lowercase hex characters (64-bit cryptographic signature)
    snprintf(out_sig_16char, 17, "%02x%02x%02x%02x%02x%02x%02x%02x",
             hmac_result[0], hmac_result[1], hmac_result[2], hmac_result[3],
             hmac_result[4], hmac_result[5], hmac_result[6], hmac_result[7]);

    return true;
}

bool QrGenerator_Update(uint32_t current_unix_time) {
    uint32_t now_tick = millis();

    if (s_current_ts == 0 || (now_tick > s_last_rotation_tick && (now_tick - s_last_rotation_tick) >= QR_ROTATION_INTERVAL_MS)) {
        s_last_rotation_tick = now_tick;
        s_current_ts = current_unix_time;

        if (QrGenerator_ComputeSignature(CABINET_ID, s_current_ts, s_nonce_counter, s_current_sig)) {
            // Formatted URL with 16-hex signature and nonce counter
            snprintf(s_current_url, sizeof(s_current_url),
                     "https://zalo.me/s/%s/?utm_source=zalo-qr&cab=%s&ts=%lu&nonce=%lu&sig=%s",
                     MINI_APP_ID, CABINET_ID, (unsigned long)s_current_ts, (unsigned long)s_nonce_counter, s_current_sig);

            return true;
        }
    }

    return false;
}

void QrGenerator_ForceRotate(uint32_t next_nonce) {
    s_nonce_counter = next_nonce;
    s_last_rotation_tick = 0; // Force immediate recalculation on next tick
}

const char* QrGenerator_GetUrl(void) {
    return s_current_url;
}

const char* QrGenerator_GetSignature(void) {
    return s_current_sig;
}

uint32_t QrGenerator_GetTimestamp(void) {
    return s_current_ts;
}

uint32_t QrGenerator_GetNonce(void) {
    return s_nonce_counter;
}
