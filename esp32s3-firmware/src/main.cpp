#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "config.h"
#include "solenoid_driver.h"
#include "limit_switch.h"
#include "qr_generator.h"
#include "mqtt_locker.h"

static TaskHandle_t s_core0_task_handle = NULL;
static volatile uint32_t s_system_epoch_time = 0;
static uint32_t s_buzzer_silence_time = 0;

static void syncNtpTime(void) {
    configTime(25200, 0, "pool.ntp.org", "time.google.com", "time.windows.com");
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 5000)) {
        time_t now;
        time(&now);
        s_system_epoch_time = (uint32_t)now;
        Serial.printf("[NTP] Time Synchronized: %s (Epoch: %lu)\n", asctime(&timeinfo), (unsigned long)s_system_epoch_time);
    } else {
        Serial.println("[NTP] Failed NTP sync. Using fallback epoch.");
        s_system_epoch_time = 1792865100;
    }
}

// Core 0 Dedicated Task: LCD Display & Dynamic QR generation (30s rotation)
static void Core0_DisplayTask(void* pvParameters) {
    for (;;) {
        time_t now;
        time(&now);
        if (now > 1000000000) {
            s_system_epoch_time = (uint32_t)now;
        } else {
            s_system_epoch_time += 1;
        }

        if (QrGenerator_Update(s_system_epoch_time)) {
            Serial.println("==================================================");
            Serial.printf("[ESP32-S3 LCD] 16-Hex Dynamic QR Refreshed (Nonce: %lu):\n", (unsigned long)QrGenerator_GetNonce());
            Serial.printf("Cabinet:   %s\n", CABINET_ID);
            Serial.printf("Timestamp: %lu | Nonce: %lu\n", (unsigned long)QrGenerator_GetTimestamp(), (unsigned long)QrGenerator_GetNonce());
            Serial.printf("Signature: %s (64-bit Hex)\n", QrGenerator_GetSignature());
            Serial.printf("URL:       %s\n", QrGenerator_GetUrl());
            Serial.println("==================================================");
        }

        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n\n=======================================================");
    Serial.println(" SMART LOCKER HARDENED CONTROLLER (ESP32-S3 DUAL-CORE) ");
    Serial.printf(" Firmware: v2.0-Hardened | Cabinet ID: %s\n", CABINET_ID);
#ifdef USE_HARDWARE_EFUSE_HMAC
    Serial.println(" Crypto Engine: Silicon Hardware eFuse HMAC_KEY4 Enabled");
#else
    Serial.println(" Crypto Engine: Software Per-Device Key Derivation (mbedtls)");
#endif
    Serial.println("=======================================================");

    // 1. Initialize Buzzer Alarm Pin
    pinMode(BUZZER_ALARM_PIN, OUTPUT);
    digitalWrite(BUZZER_ALARM_PIN, LOW);

    // 2. Initialize Bare-metal Solenoid Actuator Driver (Safe 400ms)
    SolenoidDriver_Init();
    Serial.println("[DRIVER] Solenoid Driver initialized (400ms pulse safety + Auth tracking).");

    // 3. Initialize 50ms Debounced Limit Switch Sensors
    LimitSwitch_Init();
    Serial.println("[SENSOR] Limit Switch door sensors initialized (50ms DSP filter).");

    // 4. Initialize HMAC Subsystem
    QrGenerator_Init();

    // 5. Connect Wi-Fi
    Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    uint8_t wifi_attempts = 0;
    while (WiFi.status() != WL_CONNECTED && wifi_attempts < 20) {
        delay(300);
        Serial.print(".");
        wifi_attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        syncNtpTime();
    } else {
        Serial.println("\n[WIFI] Connection timeout. Standalone mode.");
        s_system_epoch_time = 1792865100;
    }

    // 6. Initialize MQTT
    MqttLocker_Init();

    // 7. Core 0 Display Worker
    xTaskCreatePinnedToCore(
        Core0_DisplayTask,
        "Core0_Display",
        4096,
        NULL,
        1,
        &s_core0_task_handle,
        0
    );

    Serial.println("[SYSTEM] Tamper Watchdog Armed & Real-Time Loop Active on Core 1.");
}

void loop() {
    uint32_t now = millis();

    // 1. Maintain MQTT Network Loop
    MqttLocker_Loop();

    // 2. High-Frequency Solenoid Non-blocking Supervisor (Ensures 400ms hard pulse cutoff)
    SolenoidDriver_Update();

    // 3. Update Limit Switch 50ms Discrete Digital Filter
    LimitSwitch_Update();

    // 4. Tamper Detection Watchdog
    for (uint8_t box = 1; box <= TOTAL_BOX_COUNT; box++) {
        DoorState_t new_state;
        if (LimitSwitch_PollStateChange(box, &new_state)) {
            if (new_state == DOOR_STATE_OPENED) {
                // Check if door was legitimately unlocked by server
                if (SolenoidDriver_IsAuthorizedOpen(box)) {
                    Serial.printf("[EVENT] Box #%d Door opened legitimately.\n", box);
                    SolenoidDriver_ClearAuthorization(box);
                    MqttLocker_PublishDoorEvent(box, "DOOR_OPENED", "OPENED");
                } else {
                    // CROWBAR BREACH DETECTED!
                    Serial.printf("\n🚨🚨🚨 [CRITICAL TAMPER BREACH] FORCED ENTRY DETECTED ON BOX #%d! 🚨🚨🚨\n", box);
                    // Activate Loud Siren
                    digitalWrite(BUZZER_ALARM_PIN, HIGH);
                    s_buzzer_silence_time = now + 15000; // Siren blares for 15s

                    // Dispatch urgent retained alarm MQTT packet
                    MqttLocker_PublishAlarm(box, "FORCED_ENTRY_DETECTED");
                }
            } else {
                Serial.printf("[EVENT] Box #%d Door CLOSED securely.\n", box);
                MqttLocker_PublishDoorEvent(box, "DOOR_CLOSED", "CLOSED");
            }
        }
    }

    // Auto-silence buzzer after timeout
    if (s_buzzer_silence_time > 0 && now > s_buzzer_silence_time) {
        digitalWrite(BUZZER_ALARM_PIN, LOW);
        s_buzzer_silence_time = 0;
    }

    delay(5);
}
