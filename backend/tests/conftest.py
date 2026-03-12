# will have fixtures
from fastapi.testclient import TestClient
from main import app, get_detection_service
import os
import cv2 as cv
import numpy as np
from detection import DetectionService
import pytest

@pytest.fixture # decorator makes it so they are injectable to other files (scope is directory + children)
def mock_client():
    app.dependency_overrides[get_detection_service] = lambda: DetectionService(pytorch_fn=mock_pytorch, opencv_fn=mock_opencv)
    return TestClient(app)

@pytest.fixture
def real_client():
    app.dependency_overrides = {}
    return TestClient(app)

def mock_opencv(image_path):
    return [{"x": 10, "y": 10, "w": 50, "h": 50}]

def mock_pytorch(image_path, mask_path):
    fake_mask = np.zeros((100, 100), dtype=np.uint8)
    cv.imwrite(mask_path, fake_mask)
    return 75

