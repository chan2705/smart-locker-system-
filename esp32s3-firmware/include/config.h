#ifndef CONFIG_H
#define CONFIG_H

#include <stdint.h>

// ==========================================
// CABINET IDENTIFICATION & MASTER CRYPTO KEY
// ==========================================
#define CABINET_ID                  "CAB_01"
#define MASTER_SECRET_KEY           "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
#define MINI_APP_ID                 "smartlocker"

// Hardware eFuse Cryptographic Acceleration Switch
// Uncomment in production with flashed eFuse Key Block 4:
// #define USE_HARDWARE_EFUSE_HMAC

// ==========================================
// WI-FI & MQTT BROKER CONFIGURATION
// ==========================================
#define WIFI_SSID                   "SmartLocker_WiFi"
#define WIFI_PASSWORD               "Vinhomes@2026"

#define MQTT_BROKER                 "broker.emqx.io"
#define MQTT_PORT                   1883
#define MQTT_CLIENT_ID              "ESP32S3_LOCKER_CAB_01"

#define TOPIC_CMD                   "locker/" CABINET_ID "/cmd"
#define TOPIC_ACK                   "locker/" CABINET_ID "/ack"
#define TOPIC_EVENT                 "locker/" CABINET_ID "/event"
#define TOPIC_ALARM                 "locker/" CABINET_ID "/alarm"
#define TOPIC_STATUS                "locker/" CABINET_ID "/status"

// ==========================================
// TIMING CONSTANTS (STRICT RTOS SAFETY)
// ==========================================
#define SOLENOID_PULSE_DURATION_MS  400UL     // Strictly 400ms pulse (prevents thermal runaway)
#define SOLENOID_COOLDOWN_MS        1000UL    // 1-second refractory cooldown per box
#define LIMIT_SWITCH_DEBOUNCE_MS    50UL      // 50ms discrete digital low-pass debounce filter
#define QR_ROTATION_INTERVAL_MS     30000UL   // 30 seconds dynamic QR regeneration
#define NTP_SYNC_INTERVAL_MS        3600000UL // 1 hour NTP resync

// ==========================================
// HARDWARE CAPACITY & PIN MAPPINGS
// ==========================================
#define TOTAL_BOX_COUNT             12

// Solenoid Control GPIO Pins (Active HIGH: Drives MOSFET / Optocoupler relay)
static const uint8_t SOLENOID_PINS[TOTAL_BOX_COUNT] = {
    4, 5, 6, 7, 15, 16, 17, 18, 8, 9, 10, 11
};

// Limit Switch Door Sensors (Active LOW with internal PULLUP: LOW = Closed, HIGH = Opened)
static const uint8_t LIMIT_SWITCH_PINS[TOTAL_BOX_COUNT] = {
    12, 13, 14, 21, 47, 48, 45, 38, 39, 40, 41, 42
};

// Tamper Detection Siren & Buzzer Alarm Pin (Active HIGH)
#define BUZZER_ALARM_PIN            22

// SPI Pins for MFRC522 RFID Reader
#define RFID_SS_PIN                 1
#define RFID_RST_PIN                2
#define RFID_SCK_PIN                19
#define RFID_MISO_PIN               20
#define RFID_MOSI_PIN               3

// Static Buffer Size Boundaries
#define JSON_BUFFER_SIZE            512
#define MQTT_PAYLOAD_MAX_LEN        512
#define QR_URL_MAX_LEN              256
#define HMAC_16HEX_LEN              17
#define DEVICE_KEY_HEX_LEN          65

#endif // CONFIG_H
