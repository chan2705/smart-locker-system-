#ifndef LIMIT_SWITCH_H
#define LIMIT_SWITCH_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    DOOR_STATE_CLOSED = 0,
    DOOR_STATE_OPENED = 1
} DoorState_t;

typedef struct {
    uint8_t pin;
    DoorState_t confirmed_state;
    DoorState_t raw_state;
    uint32_t last_debounce_time;
    bool state_changed_flag;
} LimitSwitch_t;

/**
 * Initializes all 12 Limit Switch GPIO pins with INPUT_PULLUP
 */
void LimitSwitch_Init(void);

/**
 * Updates 50ms digital debounce filter across all channels
 * Call periodically in main RTOS task loop
 */
void LimitSwitch_Update(void);

/**
 * Get current debounced confirmed state of a box door
 * @param box_id 1 to 12
 */
DoorState_t LimitSwitch_GetState(uint8_t box_id);

/**
 * Checks if a transition occurred (e.g. door was opened or closed)
 * Clears the change flag upon reading
 */
bool LimitSwitch_PollStateChange(uint8_t box_id, DoorState_t* new_state);

#ifdef __cplusplus
}
#endif

#endif // LIMIT_SWITCH_H
