#include "limit_switch.h"
#include "config.h"
#include <Arduino.h>

static LimitSwitch_t s_switches[TOTAL_BOX_COUNT];

void LimitSwitch_Init(void) {
    uint32_t now = millis();
    for (uint8_t i = 0; i < TOTAL_BOX_COUNT; i++) {
        s_switches[i].pin = LIMIT_SWITCH_PINS[i];
        pinMode(s_switches[i].pin, INPUT_PULLUP);

        // Active LOW: LOW = Door Closed, HIGH = Door Opened
        int raw = digitalRead(s_switches[i].pin);
        DoorState_t initial = (raw == HIGH) ? DOOR_STATE_OPENED : DOOR_STATE_CLOSED;
        s_switches[i].confirmed_state = initial;
        s_switches[i].raw_state = initial;
        s_switches[i].last_debounce_time = now;
        s_switches[i].state_changed_flag = false;
    }
}

void LimitSwitch_Update(void) {
    uint32_t now = millis();

    for (uint8_t i = 0; i < TOTAL_BOX_COUNT; i++) {
        LimitSwitch_t* sw = &s_switches[i];
        int reading = digitalRead(sw->pin);
        DoorState_t current_reading = (reading == HIGH) ? DOOR_STATE_OPENED : DOOR_STATE_CLOSED;

        // Reset debounce timer if reading changed
        if (current_reading != sw->raw_state) {
            sw->raw_state = current_reading;
            sw->last_debounce_time = now;
        }

        // Only transition if stable for at least LIMIT_SWITCH_DEBOUNCE_MS (50ms)
        if (now > sw->last_debounce_time && (now - sw->last_debounce_time) >= LIMIT_SWITCH_DEBOUNCE_MS) {
            if (sw->raw_state != sw->confirmed_state) {
                sw->confirmed_state = sw->raw_state;
                sw->state_changed_flag = true;
            }
        }
    }
}

DoorState_t LimitSwitch_GetState(uint8_t box_id) {
    if (box_id < 1 || box_id > TOTAL_BOX_COUNT) {
        return DOOR_STATE_CLOSED;
    }
    return s_switches[box_id - 1].confirmed_state;
}

bool LimitSwitch_PollStateChange(uint8_t box_id, DoorState_t* new_state) {
    if (box_id < 1 || box_id > TOTAL_BOX_COUNT) {
        return false;
    }

    uint8_t idx = box_id - 1;
    if (s_switches[idx].state_changed_flag) {
        s_switches[idx].state_changed_flag = false;
        if (new_state) {
            *new_state = s_switches[idx].confirmed_state;
        }
        return true;
    }

    return false;
}
