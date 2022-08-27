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
    if ((e.code == "KeyW" || e.code == "KeyD" || e.code == "KeyS" || e.code == "KeyA")) {
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


    /*
    //Move system goes here!!! Move player and check for events.
    if (newCell != null && newCellEntity.type != "wall") { //if the cell to move to is NOT a wall:
        //update previously visited cell.
        currentCell.innerHTML = currentCellEntity.symbol; //change cell back to original character.
        if (currentCell.classList.contains("gameSpace__specialLocations")) {
            if (!currentCellEntity.reVisitable) { //revisitable tiles don't get greyed out.
                currentCell.style.opacity = 0.3;
            }
            currentCell.style.fontSize = "20px";
        } else {
            currentCell.style.fontWeight = "normal";
            currentCell.style.opacity = 0.3;
        }

        //update new cell.
        playerX = nextCellPos[0]; //move player.
        playerY = nextCellPos[1];
        //new cell styles.
        newCell.style.fontSize = "15px";
        //Do game updates.
        showCellsInVision(5, playerX, playerY); //Fog of war
        game.movesSinceLastRandomEncounter = game.movesSinceLastRandomEncounter + 1; //random encounter is ++. when this is >= 5, rand encounter is possible.

        //Choose action, if applicable:-----------------------------------------------------------------------------------------||-----
        //Begin encounters on locations, if they're new.
        if (newCell.classList.contains("gameSpace__specialLocations") && (!newCellEntity.alreadyVisited || newCellEntity.reVisitable)) { //change size of special locations on walked on.
            //Change the map symbol for the tile.
            if (currentCellEntity.type == "minor encounter" || currentCellEntity.type == "major encounter" || currentCellEntity.type == "boss encounter") {
                currentCellEntity.updateSymbol();
                currentCell.innerHTML = currentCellEntity.symbol;
            }
            //Begin dialogue or encounter as necessary.
            if (newCellEntity.type == "shop") {
                openShop("open");
            } else if (newCellEntity.type == "boss encounter" && newCellEntity.alreadyVisited) {
                //Boss revisit dialogue func
            } else {
                //new tile encounter.
                await beginEncounter(newCellEntity);
            }
        } else if (game.movesSinceLastRandomEncounter >= 5) {
            //Random chance for encounters on untread path tiles.
            let tempChance = playerRandInt(1, game.randomEncounterChance, "floor"); //Maybe add other events too?
            console.log(tempChance)
            if (newCellEntity.type == "path" && !newCellEntity.alreadyVisited && tempChance == 1) {
                game.movesSinceLastRandomEncounter = 0;
                await beginEncounter(newCellEntity);
            }
            newCellEntity.alreadyVisited = true;
        }
    }*/
}