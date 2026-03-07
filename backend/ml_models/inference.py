import numpy as np
import cv2 as cv
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
import segmentation_models_pytorch as smp 
import os


#returns a json with coordinates to cloned parts
def run_opencv(image_path):
    img = cv.imread(image_path)
    gray= cv.cvtColor(img,cv.COLOR_BGR2GRAY)
    sift = cv.SIFT_create()
    keypoints, descriptors = sift.detectAndCompute(gray, None)
    index_params = dict(algorithm=1, trees=5)  # algorithm=1 is FLANN_INDEX_KDTREE
    search_params = dict(checks=50)
    matcher = cv.FlannBasedMatcher(index_params, search_params)
    matches = matcher.knnMatch(descriptors, descriptors, k=3)

    good_matches = []

    for match_group in matches:
        filtered = [m for m in match_group if m.trainIdx != m.queryIdx]
    
        # now we have two real matches to apply lowe's test to
        if len(filtered) < 2:
            continue
        
        m, n = filtered[0], filtered[1]
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)
    # only some of these matches are good so now we use ransac algorithm to further filter out fake matches
    if len(good_matches) < 4:
        return []
    def bounding_box(points):
        x = int(np.min(points[:, 0, 0]))
        y = int(np.min(points[:, 0, 1]))
        w = int(np.max(points[:, 0, 0])) - x
        h = int(np.max(points[:, 0, 1])) - y

        return {"x": x, "y": y, "w": w, "h": h}

    remaining_matches = good_matches
    regions = []

    while len(remaining_matches) >= 4:
        src_points = np.float32([keypoints[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_points = np.float32([keypoints[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        _, mask = cv.findHomography(src_points, dst_points, cv.RANSAC, 5.0)

        if mask is None:
            break
        inliers = [m for m, flag in zip(remaining_matches, mask.ravel()) if flag == 1]
        outliers = [m for m, flag in zip(remaining_matches, mask.ravel()) if flag == 0]

        if len(inliers) == 0:
            break

        src_inliers = np.float32([keypoints[m.queryIdx].pt for m in inliers]).reshape(-1, 1, 2)
        dst_inliers = np.float32([keypoints[m.trainIdx].pt for m in inliers]).reshape(-1, 1, 2)

        regions.append({
            "original": bounding_box(src_inliers),
            "clone": bounding_box(dst_inliers)

        })
        
        remaining_matches = outliers
    seen = set()
    unique_boxes = []
    for region in regions:
        for box in (region["original"], region["clone"]):
            # round to nearest 20 pixels to treat nearby boxes as the same
            key = (round(box["x"] / 20) * 20, round(box["y"] / 20) * 20)
            if key not in seen:
                seen.add(key)
                unique_boxes.append(box)
    return unique_boxes


model_path = "C:/Users/idide/imgmanipfind/ForgeFind/backend/ml_models/weights/unet_768_best.pth"

unet = smp.Unet(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=3,
    classes=1
)

unet.load_state_dict(torch.load(model_path, map_location="cpu"))
unet.eval()

# ─── Inference function ────────────────────────────────────────────────────────

def run_pytorch(image_path, mask_path):

    # read and convert
    img = cv.imread(image_path)
    if img is None:
        return 0.0
    print("loading model from:", model_path)
    print("model file exists:", os.path.exists(model_path))
    # handle grayscale
    if len(img.shape) == 2:
        img = cv.cvtColor(img, cv.COLOR_GRAY2RGB)
    else:
        img = cv.cvtColor(img, cv.COLOR_BGR2RGB)

    # save original dimensions for upscaling later
    original_h, original_w = img.shape[:2]

    # resize to match training size
    img_resized = cv.resize(img, (768, 768))

    # normalize — must match training preprocessing exactly
    img_resized = img_resized / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std  = np.array([0.229, 0.224, 0.225])
    img_resized = (img_resized - mean) / std

    # HxWxC → CxHxW, add batch dimension
    img_resized = img_resized.transpose(2, 0, 1)
    tensor = torch.tensor(img_resized, dtype=torch.float32).unsqueeze(0)

    # forward pass
    with torch.no_grad():
        output = unet(tensor)

    # get probability map as float — don't threshold yet
    probs = torch.sigmoid(output).squeeze().cpu().numpy()  # shape (768, 768)
    print("raw output min:", output.min().item())
    print("raw output max:", output.max().item())
    print("probs min:", probs.min())
    print("probs max:", probs.max())
    print("probs mean:", probs.mean())
    print("pixels above 0.5:", (probs > 0.5).sum())
    # upscale the float probability map to original resolution
    probs_upscaled = cv.resize(probs, (original_w, original_h), interpolation=cv.INTER_LINEAR)

    # threshold at full resolution
    mask_binary = (probs_upscaled > 0.5).astype(np.uint8) * 255

    # light cleanup
    kernel     = np.ones((2, 2), np.uint8)
    mask_binary = cv.morphologyEx(mask_binary, cv.MORPH_OPEN,  kernel)
    mask_binary = cv.morphologyEx(mask_binary, cv.MORPH_CLOSE, kernel)

    cv.imwrite(mask_path, mask_binary)

    # confidence — average probability of flagged pixels only
    white_pixel_probs = probs_upscaled[mask_binary == 255]
    if len(white_pixel_probs) == 0:
        return 0.0

    return round(float(np.mean(white_pixel_probs)) * 100, 2)