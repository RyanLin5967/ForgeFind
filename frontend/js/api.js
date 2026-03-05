import {draw_mask} from "./canvas.js"
import {get_score} from "./app.js"
export async function send_image(file){
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
    });

    const data = await response.json()
    console.log(data);
    draw_mask(data.mask_url, data.coords)
    get_score(data.confidence_score)
}
