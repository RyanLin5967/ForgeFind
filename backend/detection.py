from concurrent.futures import ThreadPoolExecutor 

class DetectionService:
    def __init__(self, pytorch_fn, opencv_fn):
        self.run_pytorch = pytorch_fn
        self.run_opencv = opencv_fn
    def analyse(self, mask_path, org_path):
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_opencv = executor.submit(self.run_opencv, org_path)
            future_pytorch = executor.submit(self.run_pytorch, org_path, mask_path)
        result_opencv = future_opencv.result()
        result_pytorch = future_pytorch.result()
        return result_opencv, result_pytorch