async function keyDownHandler(mapArray, player, e) {
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
    //Player movment keys.
    //NOTE: needs to be restricted depending on gamestate!
    if ((e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA") && game.gameState == "movement") {
        playerMovementHandler(e, mapArray, player);
    }
}

async function windowNavButtonHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

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
        //first set all to display none, then display new one.
        document.getElementById("gamePage__gameSpace__map").style.display = "none";
        document.getElementById("gamePage__gameSpace__encounter").style.display = "none";
        document.getElementById("gamePage__gameSpace__inventory").style.display = "none";
        document.getElementById("gamePage__gameSpace__shop").style.display = "none";

        //Show new window.
        switch (windowDirectory[currentWindowIndex]) {
            case "map":
                document.getElementById("gamePage__gameSpace__map").style.display = "block";
                if(game.gameState != "encounter"){
                    game.gameState = "movement";
                }
                break;
            case "encounter":
                document.getElementById("gamePage__gameSpace__encounter").style.display = "block";
                break;
            case "inventory":
                document.getElementById("gamePage__gameSpace__inventory").style.display = "block";
                game.gameState = "inventory";
                break;
            case "shop":
                document.getElementById("gamePage__gameSpace__shop").style.display = "block";
                break;
        }
    }
    //update title.
    document.getElementById("gamePage__header__windowDisplay").innerHTML = `test window name \"${windowDirectory[currentWindowIndex]}\"`;
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

async function playerMovementHandler(e, mapArray, player) {
    let boardRows = document.getElementById("gamePage__gameSpace__map").children;
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
    switch (e.code) {
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

    if ((nextCellPos[0] < mapArray.length && nextCellPos[1] <= mapArray[0].length) && (nextCellPos[0] >= 0 && nextCellPos[1] >= 0)) { //check for out of bounds. //Not working.
        newCell = document.getElementById(`[${nextCellPos[0]}][${nextCellPos[1]}]`);
        let tempPosition = newCell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
        newCellEntity = mapArray[tempPosition[0]][tempPosition[1]];
    }

    //Move the player.
    if(newCell != null && newCellEntity instanceof WallCell == false){
        clearPlayer(player, mapArray);
        player.mapPosition = [nextCellPos[0], nextCellPos[1]];
        showCellsInVision(5, player.mapPosition[0], player.mapPosition[1], mapArray);
        showPlayer(player);
    }
}