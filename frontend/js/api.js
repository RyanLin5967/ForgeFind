export async function send_image(file){
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
    });
    console.log(response.json());
}