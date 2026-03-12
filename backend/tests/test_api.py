# fast mock tests (validation, response format)
import pytest
import numpy as np
import cv2 as cv

@pytest.mark.fast
def test_valid_file(mock_client):
    img = np.zeros((10, 10, 3), dtype=np.uint8)
    _, buffer = cv.imencode(".jpg", img)
    response = mock_client.post(
        "/upload",
        files={"image": ("test.jpg", buffer.tobytes(), "image/jpg")}
    )
    data = response.json()
    assert response.status_code == 200, "incorrect status code"
    assert data["status"] == "success", "not success"
    assert data["confidence_score"] == 75, "incorrect mock confidence_score"
    assert "confidence_score" in data, "doesn't have confidence_score field"
    assert "mask_url" in data, "doesn't have mask_data field"
    assert "org_url" in data, "doesn't have org_url field"
    assert "coords" in data, "doesn't have coords field"
    

@pytest.mark.fast
def test_invalid_file(mock_client):
    response = mock_client.post(
        "/upload",
        files={"image": ("test.txt", b"not an image", "text/plain")}
    )
    assert response.status_code == 415
    assert response.json()["detail"] == "Invalid file type."