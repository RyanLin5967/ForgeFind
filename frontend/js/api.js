import {draw_visuals} from "./canvas.js"

export async function send_image(file){
    const formData = new FormData();
    formData.append("image", file);
    try{
        const response = await fetch("http://localhost:8000/upload", {
            method: "POST",
            body: formData,
        });
        if(!response.ok){ // if response fails then response.ok will be false
            throw new Error(error.detail || "server error")
        }
    } catch (error){
        throw error
    }
    const data = await response.json()
    console.log(data);
    draw_visuals(data.org_url, data.mask_url, data.coords);
    return data;
}