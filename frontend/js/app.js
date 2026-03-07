import {send_image} from "./api.js"

export function get_score(score){
    //data transfer works
    return score
}
document.body.classList.add('notransition');
const selectImg = document.getElementById('select-img');
selectImg.addEventListener("dragover", (e) => {
    e.preventDefault();
});
selectImg.addEventListener("drop", (e) => { //when user 
    e.preventDefault();
    const img = e.dataTransfer.files[0];
    send_image(img)
    showLoadingScreen();
});

window.addEventListener('load', () => {
    document.body.classList.remove('notransition');
});
document.getElementById('select-img').addEventListener('click', () => {
  document.getElementById('imginput').click();
  showLoadingScreen();
});
// add separate action listener for when user actually selects element
function showLoadingScreen(){
    document.getElementById('loading-screen').classList.remove('hidden');
    for (let i = 1; i<=3; i++){
        document.getElementById(`loading-circle${i}`).classList.remove('hidden')
    }
    document.getElementById('filled-circle').classList.remove('hidden')
    document.getElementById('scan-line').classList.remove('hidden')

    setTimeout( () => {
        document.getElementById('loading-screen').classList.add('hidden');
        for (let j = 1; j<=3; j++){
            document.getElementById(`loading-circle${j}`).classList.add('hidden')
        }
        document.getElementById('filled-circle').classList.add('hidden')
        document.getElementById('scan-line').classList.add('hidden')

    }, 300000);
}