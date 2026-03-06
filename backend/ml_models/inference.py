import numpy as np
import cv2 as cv
from fastapi.responses import JSONResponse

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
#returns path to mask image, creates mask with black for authentic pixels, white for altered ones
def run_pytorch(image_path):
    mask_path = f"{image_path.split("_")[0]}_mask.{image_path.split(".")[1]}"

    return mask_path