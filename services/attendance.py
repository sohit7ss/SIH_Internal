def calculate_attendance(connected_duration_sec: int, required_duration_sec: int) -> dict:
    if required_duration_sec <= 0:
        # Defensive: bad data shouldn't crash the sync, just flag it
        return {
            "connectedDurationSec": connected_duration_sec,
            "requiredDurationSec": required_duration_sec,
            "present": False
        }

    threshold = 0.75 * required_duration_sec
    present = connected_duration_sec >= threshold

    return {
        "connectedDurationSec": connected_duration_sec,
        "requiredDurationSec": required_duration_sec,
        "present": present
    }