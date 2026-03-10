import {draw_visuals} from "./canvas.js"

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
    draw_visuals(data.org_url, data.mask_url, data.coords);
    return data;
}