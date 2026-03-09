import {draw_mask} from "./canvas.js"

let score = null;

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
    return data;
}
export function getScore(){
    return score;
}