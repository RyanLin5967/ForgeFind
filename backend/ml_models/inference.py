import numpy as np
import cv2 as cv
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
import segmentation_models_pytorch as smp


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

model_path = "C:/Users/idide/imgmanipfind/ForgeFind/backend/ml_models/weights/casia_tamper_unet_latest.pth"
model = smp.Unet(
    encoder_name="resnet34",
    encoder_weights=None,
    in_channels=3,
    classes=1
)
model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
model.eval()
def run_pytorch(image_path, mask_path):
    img = cv.imread(image_path)
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    original_h, original_w = img.shape[:2]
    img = cv.resize(img, (256, 256))
    img = img / 255.0  # first scale to 0-1

    # then apply imagenet normalization
    mean = np.array([0.485, 0.456, 0.406])
    std  = np.array([0.229, 0.224, 0.225])
    img = (img - mean) / std

    img = img.transpose(2, 0, 1)
    img = torch.tensor(img, dtype=torch.float32)
    img = img.unsqueeze(0)                           # add batch dimension → 1xCxHxW

    device = "cpu"
    model.to(device)
    img = img.to(device)

    # forward pass
    with torch.no_grad():                              # turn off gradient tracking
        output = model(img)                            # run the image through the model

    # threshold
    probs = torch.sigmoid(output)
    mask = (probs > 0.5).float()

    # squeeze to numpy
    probs_np = probs.squeeze(0).squeeze(0).cpu().numpy()
    mask_np_binary = mask.squeeze(0).squeeze(0).cpu().numpy()
    
    mask_save = (mask_np_binary * 255).astype(np.uint8)
    mask_save = cv.resize(mask_save, (original_w, original_h), interpolation=cv.INTER_LINEAR)
    _, mask_save = cv.threshold(mask_save, 127, 255, cv.THRESH_BINARY)
    mask_save = cv.GaussianBlur(mask_save, (5, 5), 0)
    _, mask_save = cv.threshold(mask_save, 127, 255, cv.THRESH_BINARY)
    kernel = np.ones((3, 3), np.uint8)
    mask_save = cv.morphologyEx(mask_save, cv.MORPH_OPEN, kernel)   # removes small white dots
    mask_save = cv.morphologyEx(mask_save, cv.MORPH_CLOSE, kernel)  # fills small holes

    cv.imwrite(mask_path, mask_save)
    # confidence = average probability of only the flagged pixels
    white_pixel_probs = probs_np[mask_np_binary == 1]

    if len(white_pixel_probs) == 0:
        confidence = 0.0 
    else:
        confidence = round(float(np.mean(white_pixel_probs)) * 100, 2)

    return confidence    