# slow tests (if it can detected splices, copy-move forgery, no false positives)
import pytest
import numpy as np
import cv2 as cv
import os

@pytest.mark.slow
@pytest.mark.parametrize("filename", os.listdir("tests/test_images/forgery"))
def test_detects_forgeries(real_client, filename):
    with open(os.path.join("tests/test_images/forgery", filename), "rb") as f:
        response = real_client.post(
            "/upload",
            files={"image": (filename, f, "image/jpg")}
        )
    if "cpypaste" in filename:
        assert len(response.json()["coords"]) == 2, "opencv failed" #maybe change to >= 2 if you add images with more than one copy
    if "splice" in filename:
        assert response.json()["confidence_score"] > 80.0, "pytorch failed"
    
@pytest.mark.slow
@pytest.mark.parametrize("filename", os.listdir("tests/test_images/authentic"))
def test_passes_authentic(real_client, filename):
    with open(os.path.join("tests/test_images/authentic", filename), "rb") as f:
        response = real_client.post(
            "/upload",
            files={"image": (filename, f, "image/jpg")}
        )
    assert response.json()["confidence_score"] == 0, "false positive"
    