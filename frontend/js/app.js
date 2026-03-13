import {send_image} from "./api.js"
import {renderView, initCanvas} from "./canvas.js"

let imagePromise = null;
let img = null;
function getLevel(confScore){
    if (confScore <= 30) {
        return "Low Risk"
    }
    if (confScore <= 70) {
        return "Medium Risk"
    }
    if (confScore <= 100) {
        return "High Risk"
    }
}
function isDetected(confScore){
    if (confScore <= 30) {
        return "No"
    }
    if (confScore <= 70) {
        return "Maybe"
    }
    if (confScore <= 100) {
        return "Yes"
    }
}
function getColor(risk){
    if (risk === "Low Risk" || risk === "No")
        return "green"
    if (risk === "Medium Risk" || risk === "Maybe") {
        return "yellow"
    }
    if (risk === "High Risk" || risk === "Yes"){
        return "red"
    }
}
function getOpenCV(opencv){
    if (opencv.length >= 1){
        return 98;
    }
    return 0;
}

function getFullScore(opencv, pytorch){
    if (opencv.length >= 1){
        return 98;
    }
    return Math.round(pytorch)
}
window.addEventListener('load', () => {
    document.body.classList.remove('notransition');
    initCanvas('result-canvas');
});
document.body.classList.add('notransition');
const selectImg = document.getElementById('select-img');
selectImg.addEventListener("dragover", (e) => {
    e.preventDefault();
});
selectImg.addEventListener("drop", (e) => {
    e.preventDefault();
    img = e.dataTransfer.files[0];
    imagePromise = send_image(img)
    showLoadingScreen(img);
});
selectImg.addEventListener('click', (e) => {
    document.getElementById('imginput').click();
});
document.getElementById('imginput').addEventListener("change", (e) => {
    img = e.currentTarget.files[0];
    imagePromise = send_image(img)
    showLoadingScreen(img);
})

// option row buttons
document.getElementById('org-img-btn').addEventListener('click', () => {
    renderView('original');
});

document.getElementById('noise-btn').addEventListener('click', () => {
    renderView('noise');
});

document.getElementById('clone-btn').addEventListener('click', () => {
    renderView('clone');
});

document.getElementById('overall-btn').addEventListener('click', () => {
    renderView('overall');
});

async function showLoadingScreen(){
    document.getElementById('loading-screen').classList.remove('hidden');
    try{
        const data = await imagePromise;
        document.getElementById('loading-screen').classList.add('hidden');
        showResults(data);
    } catch (error){
        alert("error" || error.detail)
    }
}
async function showResults(data){
    document.getElementById('results-page').classList.remove('hidden');
    document.getElementById('conf-percent').textContent = getFullScore(data.coords, data.confidence_score) +  "%";
    document.getElementById('select-img').classList.add('hidden')
    document.getElementById('conf-level').textContent = getLevel(getFullScore(data.coords, data.confidence_score));
    document.getElementById('conf-container').style.color = getColor(getLevel(getFullScore(data.coords, data.confidence_score)));
    document.getElementById('conf-bar').style.backgroundColor = getColor(getLevel(getFullScore(data.coords, data.confidence_score)));
    if (getFullScore(data.coords, data.confidence_score) === 0) {
        document.getElementById('conf-bar').style.width = "0.01%";
    }else{
        document.getElementById('conf-bar').style.width = "" + getFullScore(data.coords, data.confidence_score) + "%"
    }

    // copy-move forgery stuff
    document.getElementById('copy-icon').style.backgroundColor = getColor(getLevel(getOpenCV(data.coords)));
    document.getElementById('c-mf-bar').style.width = "" + getOpenCV(data.coords) + "%"
    document.getElementById('c-mf-percent').textContent = getOpenCV(data.coords) + "%";
    document.getElementById('c-mf-decision').textContent = isDetected(getOpenCV(data.coords))
    document.getElementById('c-mf-decision').style.color = getColor(isDetected(getOpenCV(data.coords)))
    document.getElementById('c-mf-decision').style.borderColor = getColor(isDetected(getOpenCV(data.coords)))
    if ((data.coords).length > 0) {
        document.getElementById('c-mf-bar').style.backgroundColor = getColor(getLevel(getOpenCV(data.coords)))
        document.getElementById('c-mf-percent').style.color = getColor(getLevel(getOpenCV(data.coords)))
    }else {
        document.getElementById('c-mf-bar').style.backgroundColor = "green";
        document.getElementById('c-mf-bar').style.width = "0.1%";
        document.getElementById('c-mf-percent').style.color = "green"
    }

    // splicing stuff
    document.getElementById('scissor-icon').style.backgroundColor = getColor(getLevel(data.confidence_score))
    document.getElementById('spl-bar').style.width = Math.round(data.confidence_score) + "%"
    document.getElementById('spl-percent').textContent = Math.round(data.confidence_score) + "%"
    document.getElementById('spl-decision').textContent = isDetected(Math.round(data.confidence_score))
    document.getElementById('spl-decision').style.color = getColor(isDetected(data.confidence_score))
    document.getElementById('spl-decision').style.borderColor = getColor(isDetected(data.confidence_score))
    if (data.confidence_score > 0 ) {
        document.getElementById('spl-bar').style.backgroundColor = getColor(getLevel(data.confidence_score))
        document.getElementById('spl-percent').style.color = getColor(getLevel(data.confidence_score))
    }else {
        document.getElementById('spl-bar').style.backgroundColor = "green";
        document.getElementById('spl-bar').style.width = "0.1%";
        document.getElementById('spl-percent').style.color = "green"
    }
}
