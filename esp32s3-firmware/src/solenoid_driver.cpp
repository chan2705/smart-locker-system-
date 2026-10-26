#include "solenoid_driver.h"
#include "config.h"
#include <Arduino.h>
#include <atomic>

static SolenoidChannel_t s_channels[TOTAL_BOX_COUNT];
static std::atomic<bool> s_driver_locked(false);

void SolenoidDriver_Init(void) {
    for (uint8_t i = 0; i < TOTAL_BOX_COUNT; i++) {
        s_channels[i].pin = SOLENOID_PINS[i];
        s_channels[i].state = SOLENOID_STATE_IDLE;
        s_channels[i].pulse_start_time = 0;
        s_channels[i].pulse_duration = 0;
        s_channels[i].cooldown_start_time = 0;
        s_channels[i].authorized_open_window_end = 0;

        pinMode(s_channels[i].pin, OUTPUT);
        digitalWrite(s_channels[i].pin, LOW);
    }
}

bool SolenoidDriver_Trigger(uint8_t box_id, uint32_t pulse_ms) {
    if (box_id < 1 || box_id > TOTAL_BOX_COUNT) {
        return false;
    }

    uint8_t idx = box_id - 1;
    SolenoidChannel_t* ch = &s_channels[idx];
    uint32_t now = millis();

    if (ch->state == SOLENOID_STATE_COOLDOWN) {
        if (now > ch->cooldown_start_time && (now - ch->cooldown_start_time) < SOLENOID_COOLDOWN_MS) {
            return false;
        }
        ch->state = SOLENOID_STATE_IDLE;
    }

    if (ch->state == SOLENOID_STATE_ENERGIZED) {
        return false;
    }

    uint32_t safe_duration = pulse_ms;
    if (safe_duration < 100) safe_duration = 100;
    if (safe_duration > 600) safe_duration = 600;

    while (s_driver_locked.exchange(true, std::memory_order_acquire));

    ch->pulse_start_time = now;
    ch->pulse_duration = safe_duration;
    ch->state = SOLENOID_STATE_ENERGIZED;
    // Allow an authorized window of 8000ms for user to pull open door
    ch->authorized_open_window_end = now + 8000;
    digitalWrite(ch->pin, HIGH);

    s_driver_locked.store(false, std::memory_order_release);

    return true;
}

void SolenoidDriver_Update(void) {
    uint32_t now = millis();

    for (uint8_t i = 0; i < TOTAL_BOX_COUNT; i++) {
        SolenoidChannel_t* ch = &s_channels[i];

        if (ch->state == SOLENOID_STATE_ENERGIZED) {
            if (now > ch->pulse_start_time && (now - ch->pulse_start_time) >= ch->pulse_duration) {
                digitalWrite(ch->pin, LOW);
                ch->state = SOLENOID_STATE_COOLDOWN;
                ch->cooldown_start_time = now;
            }
        } else if (ch->state == SOLENOID_STATE_COOLDOWN) {
            if (now > ch->cooldown_start_time && (now - ch->cooldown_start_time) >= SOLENOID_COOLDOWN_MS) {
                ch->state = SOLENOID_STATE_IDLE;
            }
        }

        // Expire authorization window
        if (ch->authorized_open_window_end > 0 && now > ch->authorized_open_window_end) {
            ch->authorized_open_window_end = 0;
        }
    }
}

bool SolenoidDriver_IsAuthorizedOpen(uint8_t box_id) {
    if (box_id < 1 || box_id > TOTAL_BOX_COUNT) return false;
    uint8_t idx = box_id - 1;
    uint32_t now = millis();
    return (s_channels[idx].authorized_open_window_end > 0 && now <= s_channels[idx].authorized_open_window_end);
}

void SolenoidDriver_ClearAuthorization(uint8_t box_id) {
    if (box_id >= 1 && box_id <= TOTAL_BOX_COUNT) {
        s_channels[box_id - 1].authorized_open_window_end = 0;
    }
}

SolenoidState_t SolenoidDriver_GetState(uint8_t box_id) {
    if (box_id < 1 || box_id > TOTAL_BOX_COUNT) return SOLENOID_STATE_IDLE;
    return s_channels[box_id - 1].state;
}

void SolenoidDriver_EmergencyShutdown(void) {
    for (uint8_t i = 0; i < TOTAL_BOX_COUNT; i++) {
        digitalWrite(s_channels[i].pin, LOW);
        s_channels[i].state = SOLENOID_STATE_IDLE;
        s_channels[i].authorized_open_window_end = 0;
    }
}
