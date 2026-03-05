// creates new image and draws boxes, highlights layer for where image has been modified
export async function draw_mask(mask_url, coordinates){
    const img = await fetch(mask_url);
    console.log(img.status) //WORKS
}