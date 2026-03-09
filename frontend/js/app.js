import {send_image} from "./api.js"
import {getScore} from "./api.js"

let imagePromise = null;
document.body.classList.add('notransition');
window.addEventListener('load', () => {
    document.body.classList.remove('notransition');
});
const selectImg = document.getElementById('select-img');
selectImg.addEventListener("dragover", (e) => {
    e.preventDefault();
});
selectImg.addEventListener("drop", (e) => {
    e.preventDefault();
    const img = e.dataTransfer.files[0];
    imagePromise = send_image(img)
    showLoadingScreen(img);
});
selectImg.addEventListener('click', (e) => {
    document.getElementById('imginput').click();
});
document.getElementById('imginput').addEventListener("change", (e) => {
    const img = e.currentTarget.files[0];
    imagePromise = send_image(img)
    showLoadingScreen(img);
})
function showLoadingScreen(img){
    document.getElementById('loading-screen').classList.remove('hidden');
    setTimeout( () => {
        document.getElementById('loading-screen').classList.add('hidden');
        showResults(img);
    }, 1000);
}
async function showResults(img){
    document.getElementById('results-page').classList.remove('hidden');
    const data = await imagePromise;
    document.getElementById('conf-percent').textContent = data.confidence_score +  "%";
    document.getElementById('select-img').classList.add('hidden')
    document.getElementById('user-img').src = URL.createObjectURL(await img);
    document.getElementById('conf-level').textContent = getLevel();
}
function getLevel(){
    return "Medium Risk"
}