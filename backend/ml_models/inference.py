import numpy as np
import cv2 as cv
from fastapi.responses import JSONResponse

#returns a json with coordinates to cloned parts
def run_opencv(image_path):
    # img = cv.imread(image_path)
    # gray= cv.cvtColor(img,cv.COLOR_BGR2GRAY)
    # sift = cv.SIFT_create()
    # keypoints, descriptors = sift.detectAndCompute(gray, None)
    # output_image = cv.drawKeypoints(
    #     gray, keypoints, None, 
    #     flags=cv.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
    # )
    # path = image_path.split("_")[0]
    # type = image_path.split(".")[1]
    # cv.imwrite(f'{path}_mask.{type}', output_image)
    return {"poo": 67}
#returns path to mask image, creates mask with black for authentic pixels, white for altered ones
def run_pytorch(image_path):
    mask_path = f"{image_path.split("_")[0]}_mask.{image_path.split(".")[1]}"

    return mask_path