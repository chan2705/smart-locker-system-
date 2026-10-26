#ifndef SOLENOID_DRIVER_H
#define SOLENOID_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    SOLENOID_STATE_IDLE = 0,
    SOLENOID_STATE_ENERGIZED,
    SOLENOID_STATE_COOLDOWN
} SolenoidState_t;

typedef struct {
    uint8_t pin;
    volatile SolenoidState_t state;
    volatile uint32_t pulse_start_time;
    volatile uint32_t pulse_duration;
    volatile uint32_t cooldown_start_time;
    volatile uint32_t authorized_open_window_end;
} SolenoidChannel_t;

void SolenoidDriver_Init(void);
bool SolenoidDriver_Trigger(uint8_t box_id, uint32_t pulse_ms);
void SolenoidDriver_Update(void);
SolenoidState_t SolenoidDriver_GetState(uint8_t box_id);

/**
 * Checks whether an opening of box_id was legitimately commanded by Server
 * Used by Tamper Detection Watchdog to flag forced entries
 */
bool SolenoidDriver_IsAuthorizedOpen(uint8_t box_id);

void SolenoidDriver_ClearAuthorization(uint8_t box_id);
void SolenoidDriver_EmergencyShutdown(void);

#ifdef __cplusplus
}
#endif

#endif // SOLENOID_DRIVER_H
