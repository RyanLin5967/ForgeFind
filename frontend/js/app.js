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
    // showLoadingScreen();
});

window.addEventListener('load', () => {
    document.body.classList.remove('notransition');
});
document.getElementById('select-img').addEventListener('click', () => {
  document.getElementById('imginput').click();
//   showLoadingScreen();
});
//MAKE THIS
function showLoadingScreen(){

}