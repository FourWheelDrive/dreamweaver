const windowDirectory = ["map", "encounter", "inventory", "shop"];
var currentWindowIndex = 0;

async function windowNavButtonHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

    switch(buttonId){
        case "gamePage__header__left":
            currentWindowIndex = currentWindowIndex - 1;
            if(currentWindowIndex < 0){
                currentWindowIndex = windowDirectory.length - 1;
            }
            break;
        case "gamePage__header__right":
            currentWindowIndex = currentWindowIndex + 1;
            if(currentWindowIndex > windowDirectory.length - 1){
                currentWindowIndex = 0;
            }
            break;
    }

    //If the button pressed was to change window, then do this after iterating window index.
    //NOTE: Checks might be made here later for gameState if window switches are valid.
    if(buttonId == "gamePage__header__left" || buttonId == "gamePage__header__right"){
        //first set all to display none, then display new one.
        document.getElementById("gamePage__gameSpace__map").style.display = "none";
        document.getElementById("gamePage__gameSpace__encounter").style.display = "none";
        document.getElementById("gamePage__gameSpace__inventory").style.display = "none";
        document.getElementById("gamePage__gameSpace__shop").style.display = "none";

        //Show new window.
        switch(windowDirectory[currentWindowIndex]){
            case "map":
                document.getElementById("gamePage__gameSpace__map").style.display = "block";
                break;
            case "encounter":
                document.getElementById("gamePage__gameSpace__encounter").style.display = "block";
                break;
            case "inventory":
                document.getElementById("gamePage__gameSpace__inventory").style.display = "block";
                break;
            case "shop":
                document.getElementById("gamePage__gameSpace__shop").style.display = "block";
                break;
        }
    }
    //update title.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = `test window name \"${windowDirectory[currentWindowIndex]}\"`;
    //update displays.
    if(currentWindowIndex - 1 < 0){
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[windowDirectory.length - 1]}`;
    } else {
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex - 1]}`;
    }
    if(currentWindowIndex + 1 > windowDirectory.length - 1){
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[0]}`;
    } else {
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex + 1]}`;
    }
}

async function keyDownHandler(e){
    if(e.code == "ArrowLeft" && !e.repeat){
        document.getElementById("gamePage__header__left").click();
    }
    if(e.code == "ArrowRight" && !e.repeat){
        document.getElementById("gamePage__header__right").click();
    }
}

function initializeGame(){
    //Input handler.
    document.addEventListener("keydown", keyDownHandler, false);

    var mapWidth = 31, mapHeight = 31;
    var maxTunnels = 80, maxLength = 10;
    //generate array of walls
    var mapArray = createMapArray(mapWidth, mapHeight);
    //generate random paths procedurally
    mapArray = createMapPaths(maxTunnels, maxLength, mapWidth, mapHeight, mapArray);
    //generate random locations of interest
    mapArray = placeLocation(mapArray, mapWidth-1, mapHeight-1, 0);
    //push complete mapArray to DOM
    pushMapToDOM(mapArray);
}