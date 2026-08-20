import math
from typing import Dict

def calculate_shannon_entropy(data: str) -> float:
    """Calculates the Shannon entropy of a string."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    char_map: Dict[str, int] = {}
    for char in data:
        char_map[char] = char_map.get(char, 0) + 1
    for count in char_map.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 3)

def mask_secret_value(secret: str) -> str:
    """Masks secret values for display and external API payload security."""
    if not secret:
        return "***"
    clean = secret.strip().strip("'\"`")
    length = len(clean)
    if length <= 6:
        return "******"
    if length <= 12:
        return f"{clean[:2]}{'*' * (length - 4)}{clean[-2:]}"
    prefix_len = min(4, length // 4)
    suffix_len = min(4, length // 4)
    mask_len = max(6, length - prefix_len - suffix_len)
    return f"{clean[:prefix_len]}{'*' * mask_len}{clean[-suffix_len:]}"
