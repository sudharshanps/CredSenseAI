import pytest
from backend.app.scanners.entropy import calculate_shannon_entropy, mask_secret_value

def test_shannon_entropy_calculation():
    # Repetitive strings should have low entropy
    low_entropy = calculate_shannon_entropy("aaaaaaaaaaaa")
    assert low_entropy == 0.0

    # Highly random strings should have high entropy
    high_entropy = calculate_shannon_entropy("ghp_a8F92jLkMnOpQrStUvWxYz1234567890")
    assert high_entropy > 3.5

def test_mask_secret_value():
    aws_key = "AKIAIOSFODNN7EXAMPLE"
    masked_aws = mask_secret_value(aws_key)
    assert "AKIA" in masked_aws
    assert "MPLE" in masked_aws
    assert "*" in masked_aws
    assert "IOSFODNN7" not in masked_aws

    github_token = "ghp_DEMO_EXAMPLE_NOT_REAL"
    masked_gh = mask_secret_value(github_token)
    assert "ghp" in masked_gh
    assert "REAL" in masked_gh
    assert "*" in masked_gh

def test_empty_secret_mask():
    assert mask_secret_value("") == "***"
