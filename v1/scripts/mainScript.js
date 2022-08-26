const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;

async function windowNavButtonHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

    switch(buttonId){
        case "game__page__header__left":
            currentWindowIndex = currentWindowIndex - 1;
            if(currentWindowIndex < 0){
                currentWindowIndex = windowDirectory.length - 1;
            }
            break;
        case "game__page__header__right":
            currentWindowIndex = currentWindowIndex + 1;
            if(currentWindowIndex > windowDirectory.length - 1){
                currentWindowIndex = 0;
            }
            break;
    }

    //If the button pressed was to change window, then do this after iterating window index.
    //NOTE: Checks might be made here later for gameState if window switches are valid.
    if(buttonId == "game__page__header__left" || buttonId == "game__page__header__right"){
        //first set all to display none, then display new one.
        document.getElementById("game__page__gameSpace__map").style.display = "none";
        document.getElementById("game__page__gameSpace__encounter").style.display = "none";
        document.getElementById("game__page__gameSpace__inventory").style.display = "none";
        document.getElementById("game__page__gameSpace__shop").style.display = "none";

        //Show new window.
        switch(windowDirectory[currentWindowIndex]){
            case "map":
                document.getElementById("game__page__gameSpace__map").style.display = "block";
                break;
            case "encounter":
                document.getElementById("game__page__gameSpace__encounter").style.display = "block";
                break;
            case "inventory":
                document.getElementById("game__page__gameSpace__inventory").style.display = "block";
                break;
            case "shop":
                document.getElementById("game__page__gameSpace__shop").style.display = "block";
                break;
        }
    }
    //update title.
    document.getElementById("game__page__header__windowDisplay").innerHTML = `test window name \"${windowDirectory[currentWindowIndex]}\"`;
    //update displays.
    if(currentWindowIndex - 1 < 0){
        document.getElementById("game__page__header__leftWindowDisplay").innerHTML = `${windowDirectory[windowDirectory.length - 1]}`;
    } else {
        document.getElementById("game__page__header__leftWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex - 1]}`;
    }
    if(currentWindowIndex + 1 > windowDirectory.length - 1){
        document.getElementById("game__page__header__rightWindowDisplay").innerHTML = `${windowDirectory[0]}`;
    } else {
        document.getElementById("game__page__header__rightWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex + 1]}`;
    }
}

async function keyDownHandler(e){
    if(e.code == "ArrowLeft" && !e.repeat){
        document.getElementById("game__page__header__left").click();
    }
    if(e.code == "ArrowRight" && !e.repeat){
        document.getElementById("game__page__header__right").click();
    }
}

function initializeGame(){
    //Input handler.
    document.addEventListener("keydown", keyDownHandler, false);
}