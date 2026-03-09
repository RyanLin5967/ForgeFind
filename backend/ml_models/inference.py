import numpy as np
import cv2 as cv
from fastapi.responses import JSONResponse
import torch
import segmentation_models_pytorch as smp 

#returns a json with coordinates to cloned parts
def run_opencv(image_path):
    img = cv.imread(image_path)
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
    sift = cv.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(gray, None)
    index_params = dict(algorithm=1, trees=5)
    search_params = dict(checks=50)
    matcher = cv.FlannBasedMatcher(index_params, search_params)
    matches = matcher.knnMatch(descriptors, descriptors, k=3)

    good_matches = []
    for match_group in matches:
        filtered = [m for m in match_group if m.trainIdx != m.queryIdx]
        if len(filtered) < 2:
            continue
        m, n = filtered[0], filtered[1]
        if m.distance < 0.65 * n.distance:  # stricter ratio test (was 0.75)
            # ignore matches between nearby keypoints (likely same region)
            pt1 = np.array(keypoints[m.queryIdx].pt)
            pt2 = np.array(keypoints[m.trainIdx].pt)
            if np.linalg.norm(pt1 - pt2) > 20:  # must be spatially separated
                good_matches.append(m)

    if len(good_matches) < 10:  # raised minimum (was 4)
        return []

    def bounding_box(points):
        x = int(np.min(points[:, 0, 0]))
        y = int(np.min(points[:, 0, 1]))
        w = int(np.max(points[:, 0, 0])) - x
        h = int(np.max(points[:, 0, 1])) - y
        return {"x": x, "y": y, "w": w, "h": h}

    remaining_matches = good_matches
    regions = []
    img_area = img.shape[0] * img.shape[1]

    while len(remaining_matches) >= 10:  # raised minimum (was 4)
        src_points = np.float32([keypoints[m.queryIdx].pt for m in remaining_matches]).reshape(-1, 1, 2)
        dst_points = np.float32([keypoints[m.trainIdx].pt for m in remaining_matches]).reshape(-1, 1, 2)
        _, mask = cv.findHomography(src_points, dst_points, cv.RANSAC, 3.0)  # stricter RANSAC (was 5.0)

        if mask is None:
            break

        inliers = [m for m, flag in zip(remaining_matches, mask.ravel()) if flag == 1]
        outliers = [m for m, flag in zip(remaining_matches, mask.ravel()) if flag == 0]

        if len(inliers) < 8:  # require more inliers to count as a real region (was 0)
            break

        src_inliers = np.float32([keypoints[m.queryIdx].pt for m in inliers]).reshape(-1, 1, 2)
        dst_inliers = np.float32([keypoints[m.trainIdx].pt for m in inliers]).reshape(-1, 1, 2)

        orig_box = bounding_box(src_inliers)
        clone_box = bounding_box(dst_inliers)

        # ignore tiny bounding boxes (likely noise)
        min_box_area = img_area * 0.01  # must be at least 1% of image
        if (orig_box["w"] * orig_box["h"] > min_box_area and
            clone_box["w"] * clone_box["h"] > min_box_area):
            regions.append({"original": orig_box, "clone": clone_box})

        remaining_matches = outliers

    seen = set()
    unique_boxes = []
    for region in regions:
        for box in (region["original"], region["clone"]):
            key = (round(box["x"] / 20) * 20, round(box["y"] / 20) * 20)
            if key not in seen:
                seen.add(key)
                unique_boxes.append(box)

    return unique_boxes


model_path = "C:/Users/idide/imgmanipfind/ForgeFind/backend/ml_models/weights/casia_tamper_unet_latest_old.pth"

unet = smp.Unet(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=3,
    classes=1
)

unet.load_state_dict(torch.load(model_path, map_location="cpu"))
unet.eval()

def run_pytorch(image_path, mask_path):
    img = cv.imread(image_path)
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    original_h, original_w = img.shape[:2]

    img = cv.resize(img, (256, 256))
    img = img / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std  = np.array([0.229, 0.224, 0.225])
    img = (img - mean) / std
    img = img.transpose(2, 0, 1)
    img = torch.tensor(img, dtype=torch.float32).unsqueeze(0)

    device = "cpu"
    unet.to(device)
    img = img.to(device)

    with torch.no_grad():
        output = unet(img)

    probs = torch.sigmoid(output)
    mask = (probs > 0.5).float()

    probs_np = probs.squeeze(0).squeeze(0).cpu().numpy()
    mask_np_binary = mask.squeeze(0).squeeze(0).cpu().numpy()

    probs_np = cv.resize(probs_np, (original_w, original_h), interpolation=cv.INTER_CUBIC)
    mask_np_binary = (probs_np > 0.5).astype(np.float32)
    mask_save = (mask_np_binary * 255).astype(np.uint8)

    _, mask_save = cv.threshold(mask_save, 127, 255, cv.THRESH_BINARY)
    mask_save = cv.GaussianBlur(mask_save, (3, 3), 0)
    _, mask_save = cv.threshold(mask_save, 127, 255, cv.THRESH_BINARY)
    kernel = np.ones((3, 3), np.uint8)
    mask_save = cv.morphologyEx(mask_save, cv.MORPH_OPEN, kernel)
    mask_save = cv.morphologyEx(mask_save, cv.MORPH_CLOSE, kernel)

    cv.imwrite(mask_path, mask_save)

    white_pixel_probs = probs_np[mask_np_binary == 1]
    if len(white_pixel_probs) == 0:
        confidence = 0.0
    else:
        confidence = round(float(np.mean(white_pixel_probs)) * 100, 2)

    return confidence