async function keyDownHandler(mapArray, e) {
    //Prevent default scrolling.
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    //help key.
    if (e.code == "KeyZ") {
        let tutorial = document.getElementById("main__title__tutorial");
        //gotta remove the thing every time.
        //NOTE: might have to use a similar structure to ensure compatibility for encounter end dialogues!
        function hideTutorial() {
            tutorial.style.display = "none";
            document.removeEventListener("click", hideTutorial);
            document.removeEventListener("keydown", hideTutorial);
        }

        if (tutorial.style.display == "none" || tutorial.style.display == "") {
            tutorial.style.display = "block";

            document.addEventListener("click", hideTutorial, { once: true })
            document.addEventListener("keydown", hideTutorial, { once: true })
        }
    }
    //Window navigation keys.
    //NOTE: needs to be restricted depending on gamestate!
    if ((e.code == "ArrowLeft" || e.code == "ArrowRight") && !e.repeat) {
        if (e.code == "ArrowLeft") {
            document.getElementById("gamePage__header__left").click();
        }
        if (e.code == "ArrowRight") {
            document.getElementById("gamePage__header__right").click();
        }
    }
    //Inventory naviation keys.
    if (gameManager.windowState == "action" && (e.code == "ArrowUp" || e.code == "ArrowDown")) {
        var previousPointerPosition = player.inventoryPointerPosition;
        var len = player.inventory.length;

        //Change pointer position. Then call moveInventoryMarker to update buttons.
        switch (e.code) {
            case "ArrowUp":
                player.inventoryPointerPosition = player.inventoryPointerPosition - 1;
                if (player.inventoryPointerPosition < 0) {
                    player.inventoryPointerPosition = len - 1;
                }
                break;
            case "ArrowDown":
                player.inventoryPointerPosition = player.inventoryPointerPosition + 1;
                if (player.inventoryPointerPosition > len - 1) {
                    player.inventoryPointerPosition = 0;
                }
                break;
        }
        moveInventoryMarker(previousPointerPosition);
    }
    //Player movment keys.
    //NOTE: needs to be restricted depending on gamestate!
    if (gameManager.gameState == "movement" && gameManager.windowState == "map" && (e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA")) {
        playerMovementHandler(e.code);
    }
    //change loadout from inventory.
    if (gameManager.gameState != "encounter" && gameManager.windowState == "action" && (e.code == "KeyU" || e.code == "KeyI" || e.code == "KeyJ" || e.code == "KeyK")) {
        changeLoadout(e);
    }
    //Note: Encounter keyDowns handled separately. 
    if (e.code == "Enter") {
        gameManager.roomBossCellEntity.revealBossCell();
    }
}

async function windowNavButtonHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

    //update window indices.
    switch (buttonId) {
        case "gamePage__header__left":
            currentWindowIndex = currentWindowIndex - 1;
            if (currentWindowIndex < 0) {
                currentWindowIndex = windowDirectory.length - 1;
            }
            break;
        case "gamePage__header__right":
            currentWindowIndex = currentWindowIndex + 1;
            if (currentWindowIndex > windowDirectory.length - 1) {
                currentWindowIndex = 0;
            }
            break;
    }

    //If the button pressed was to change window, then do this after iterating window index.
    //NOTE: Checks might be made here later for gameState if window switches are valid.
    if (buttonId == "gamePage__header__left" || buttonId == "gamePage__header__right") {
        var mapWindow = document.getElementById("gamePage__gameSpace__map");
        var fightWindow = document.getElementById("gamePage__gameSpace__actionWindow");
        var shopWindow = document.getElementById("gamePage__gameSpace__shop");
        //first set all to display none, then display new one.
        //Set all opacity to 1. Will change depending on phase.
        mapWindow.style.display = "none";
        fightWindow.style.display = "none";
        shopWindow.style.display = "none";

        mapWindow.style.opacity = "1";
        fightWindow.style.opacity = "1";
        shopWindow.style.opacity = "1";

        //Show new window.
        switch (windowDirectory[currentWindowIndex]) {
            case "map":
                mapWindow.style.display = "grid";
                gameManager.windowState = "map";
                if (gameManager.gameState != "movement") { //only valid when moving.
                    mapWindow.style.opacity = "0.5";
                }
                break;
            case "encounter":
                fightWindow.style.display = "grid";
                gameManager.windowState = "encounter-inventory";
                if (gameManager.gameState != "encounter" && gameManager.gameState != "dialogue") { //only valid when fighting.
                    fightWindow.style.opacity = "0.5";
                }
                break;
            case "shop":
                shopWindow.style.display = "grid";
                gameManager.windowState = "shop";
                if (gameManager.gameState != "shop") { //only valid when end of room.
                    shopWindow.style.opacity = "0.5";
                }
                break;
        }
    }
    //update title.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = `${windowTitles[currentWindowIndex]}`;
    //update displays.
    if (currentWindowIndex - 1 < 0) {
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[windowDirectory.length - 1]}`;
    } else {
        document.getElementById("gamePage__header__leftWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex - 1]}`;
    }
    if (currentWindowIndex + 1 > windowDirectory.length - 1) {
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[0]}`;
    } else {
        document.getElementById("gamePage__header__rightWindowDisplay").innerHTML = `${windowDirectory[currentWindowIndex + 1]}`;
    }
}

//Movement and Attack keys. =================================================================================================||
async function playerMovementHandler(key) {
    let boardRows = document.getElementById("gamePage__gameSpace__map__canvas").children;
    //very cool directions array! Append each element instead of having 4 switch statements.
    //[left] [right] [up] [down]
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]],
        newDirection;

    //Cells to update
    let rowCells = boardRows[(player.mapPosition[1])].children;
    let currentCell = rowCells[player.mapPosition[0]],
        nextCellPos;
    //Make an array [x][y] of position. .filter removes whitespace from split.
    let currentCellPos = currentCell.id.split(/[\[\]]/).filter(element => element.length >= 1);
    //deltapos depending on key pressed.
    switch (key) {
        case "KeyW":
            newDirection = directions[2];
            break;
        case "KeyA":
            newDirection = directions[0];
            break;
        case "KeyS":
            newDirection = directions[3];
            break;
        case "KeyD":
            newDirection = directions[1];
            break;
    }

    //Find the next cell.
    nextCellPos = [parseInt(currentCellPos[0]) + newDirection[0], parseInt(currentCellPos[1]) + newDirection[1]];
    let newCell, newCellEntity;

    if ((nextCellPos[0] < mapArray.length && nextCellPos[1] < mapArray[0].length) && (nextCellPos[0] >= 0 && nextCellPos[1] >= 0)) { //check for out of bounds. //Not working.
        newCell = document.getElementById(`[${nextCellPos[0]}][${nextCellPos[1]}]`);
        let tempPosition = newCell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
        newCellEntity = mapArray[tempPosition[0]][tempPosition[1]];
    }

    //Move the player.
    if (newCell != null && newCellEntity instanceof WallCell == false) {
        //if the new cell is a hidden boss room, exit.
        //if (newCellEntity instanceof BossEncounterCell && !newCellEntity.revealed) { return; }
        //Update previous cell.
        clearPlayer(mapArray);
        player.mapPosition = [nextCellPos[0], nextCellPos[1]];
        showCellsInVision(5);
        showPlayer();

        //Proc encounters!!!
        if (newCellEntity) {
            newCellEntity.visit();
        }
    }
}
function flushCSS(element) { //flushes css to no transition.
    element.offsetHeight;
}