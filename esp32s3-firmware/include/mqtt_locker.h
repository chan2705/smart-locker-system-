#ifndef MQTT_LOCKER_H
#define MQTT_LOCKER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

void MqttLocker_Init(void);
void MqttLocker_Loop(void);

bool MqttLocker_PublishAck(const char* tx_id, uint8_t box_id, const char* status, const char* door_state);
bool MqttLocker_PublishDoorEvent(uint8_t box_id, const char* event_type, const char* door_state);
bool MqttLocker_PublishRfidEvent(uint8_t box_id, const char* rfid_uid);
bool MqttLocker_PublishAlarm(uint8_t box_id, const char* event_name);
bool MqttLocker_PublishHeartbeat(void);

#ifdef __cplusplus
}
#endif

#endif // MQTT_LOCKER_H
