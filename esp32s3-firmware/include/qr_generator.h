#ifndef QR_GENERATOR_H
#define QR_GENERATOR_H

#include <stdint.h>
#include <stdbool.h>
#include "config.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initializes HMAC crypto subsystem and derives device key
 */
void QrGenerator_Init(void);

/**
 * Computes 16-character (64-bit) hex HMAC-SHA256 signature
 * Incorporates cabinetId, epoch timestamp, and monotonic nonceCounter
 * @param cab cabinet ID
 * @param unix_time timestamp in seconds
 * @param nonce monotonic counter
 * @param out_sig_16char output buffer of at least 17 bytes (16 hex + '\0')
 */
bool QrGenerator_ComputeSignature(const char* cab, uint32_t unix_time, uint32_t nonce, char* out_sig_16char);

/**
 * Periodically updates the dynamic QR payload every 30 seconds
 * @param current_unix_time current time from NTP
 * @return true if a new QR code was generated
 */
bool QrGenerator_Update(uint32_t current_unix_time);

/**
 * Forces out-of-band nonce increment and immediate dynamic QR regeneration
 */
void QrGenerator_ForceRotate(uint32_t next_nonce);

/**
 * Retrieve current formatted Dynamic QR Deeplink URL
 */
const char* QrGenerator_GetUrl(void);

/**
 * Retrieve current active signature (16 hex chars)
 */
const char* QrGenerator_GetSignature(void);

/**
 * Retrieve current active timestamp
 */
uint32_t QrGenerator_GetTimestamp(void);

/**
 * Retrieve current active nonce counter
 */
uint32_t QrGenerator_GetNonce(void);

#ifdef __cplusplus
}
#endif

#endif // QR_GENERATOR_H
