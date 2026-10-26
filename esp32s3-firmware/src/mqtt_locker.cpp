#include "mqtt_locker.h"
#include "config.h"
#include "solenoid_driver.h"
#include "limit_switch.h"
#include "qr_generator.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

static WiFiClient s_wifi_client;
static PubSubClient s_mqtt_client(s_wifi_client);

static char s_pub_buffer[MQTT_PAYLOAD_MAX_LEN];
static uint32_t s_last_reconnect_attempt = 0;
static uint32_t s_last_heartbeat = 0;

static void onMqttMessageReceived(char* topic, byte* payload, unsigned int length) {
    if (length >= MQTT_PAYLOAD_MAX_LEN) return;

    char json_buf[MQTT_PAYLOAD_MAX_LEN];
    memcpy(json_buf, payload, length);
    json_buf[length] = '\0';

    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, json_buf);
    if (err) return;

    const char* action = doc["action"];
    const char* tx_id = doc["tx_id"];

    if (!action) return;

    if (strcmp(action, "UNLOCK") == 0) {
        uint8_t box_id = doc["box_id"] | 0;
        uint32_t pulse_ms = doc["pulse_ms"] | SOLENOID_PULSE_DURATION_MS;

        if (box_id >= 1 && box_id <= TOTAL_BOX_COUNT) {
            bool triggered = SolenoidDriver_Trigger(box_id, pulse_ms);
            DoorState_t door_st = LimitSwitch_GetState(box_id);
            const char* door_str = (door_st == DOOR_STATE_OPENED) ? "OPENED" : "CLOSED";

            if (triggered) {
                MqttLocker_PublishAck(tx_id ? tx_id : "", box_id, "SUCCESS", "OPENED");
            } else {
                MqttLocker_PublishAck(tx_id ? tx_id : "", box_id, "ERROR_LOCKED", door_str);
            }
        }
    } else if (strcmp(action, "FORCE_ROTATE_NONCE") == 0) {
        // Out-of-band forced rotation: Server invalidated QR and commanded Nonce++
        uint32_t next_nonce = doc["nonce"] | (QrGenerator_GetNonce() + 1);
        QrGenerator_ForceRotate(next_nonce);
        Serial.printf("[SECURITY] Received FORCE_ROTATE_NONCE. Next Nonce: %lu\n", (unsigned long)next_nonce);
    }
}

void MqttLocker_Init(void) {
    s_mqtt_client.setServer(MQTT_BROKER, MQTT_PORT);
    s_mqtt_client.setCallback(onMqttMessageReceived);
    s_mqtt_client.setBufferSize(MQTT_PAYLOAD_MAX_LEN);
}

void MqttLocker_Loop(void) {
    uint32_t now = millis();

    if (!s_mqtt_client.connected()) {
        if (now > s_last_reconnect_attempt && (now - s_last_reconnect_attempt) > 5000) {
            s_last_reconnect_attempt = now;
            if (s_mqtt_client.connect(MQTT_CLIENT_ID)) {
                s_mqtt_client.subscribe(TOPIC_CMD, 1);
                MqttLocker_PublishHeartbeat();
            }
        }
    } else {
        s_mqtt_client.loop();

        if (now > s_last_heartbeat && (now - s_last_heartbeat) > 30000) {
            s_last_heartbeat = now;
            MqttLocker_PublishHeartbeat();
        }
    }
}

bool MqttLocker_PublishAck(const char* tx_id, uint8_t box_id, const char* status, const char* door_state) {
    if (!s_mqtt_client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["tx_id"] = tx_id;
    doc["box_id"] = box_id;
    doc["status"] = status;
    doc["door_state"] = door_state;
    doc["timestamp"] = millis();

    serializeJson(doc, s_pub_buffer, sizeof(s_pub_buffer));
    return s_mqtt_client.publish(TOPIC_ACK, s_pub_buffer, false);
}

bool MqttLocker_PublishDoorEvent(uint8_t box_id, const char* event_type, const char* door_state) {
    if (!s_mqtt_client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["box_id"] = box_id;
    doc["event"] = event_type;
    doc["door_state"] = door_state;
    doc["timestamp"] = millis();

    serializeJson(doc, s_pub_buffer, sizeof(s_pub_buffer));
    return s_mqtt_client.publish(TOPIC_EVENT, s_pub_buffer, false);
}

bool MqttLocker_PublishRfidEvent(uint8_t box_id, const char* rfid_uid) {
    if (!s_mqtt_client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["box_id"] = box_id;
    doc["event"] = "RFID_TAG_SCANNED";
    doc["rfid_uid"] = rfid_uid;
    doc["timestamp"] = millis();

    serializeJson(doc, s_pub_buffer, sizeof(s_pub_buffer));
    return s_mqtt_client.publish(TOPIC_EVENT, s_pub_buffer, false);
}

bool MqttLocker_PublishAlarm(uint8_t box_id, const char* event_name) {
    if (!s_mqtt_client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["cabinet_id"] = CABINET_ID;
    doc["box_id"] = box_id;
    doc["event"] = event_name;
    doc["timestamp"] = millis();

    serializeJson(doc, s_pub_buffer, sizeof(s_pub_buffer));
    return s_mqtt_client.publish(TOPIC_ALARM, s_pub_buffer, true); // QoS retained/urgent
}

bool MqttLocker_PublishHeartbeat(void) {
    if (!s_mqtt_client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["cabinet_id"] = CABINET_ID;
    doc["status"] = "ONLINE";
    doc["nonce"] = QrGenerator_GetNonce();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["uptime_sec"] = millis() / 1000;

    serializeJson(doc, s_pub_buffer, sizeof(s_pub_buffer));
    return s_mqtt_client.publish(TOPIC_STATUS, s_pub_buffer, false);
}
