//This creates and fills an array with WallCells.
function createMapArray(mapWidth, mapHeight) {
    var array = [];
    for (var i = 0; i < mapWidth; i++) {
        array.push([]); //push columns.
        for (var j = 0; j < mapHeight; j++) {
            array[i].push(new WallCell(i, j)); //push cells.
        }
    }
    return array;
}

//This replaces some of the WallCells with PathCells.
function createMapPaths(maxTunnels, maxLength, mapWidth, mapHeight, mapArray) {
    //very cool directions array! Append each element instead of having 4 switch statements.
    //                [left]   [right] [up]     [down]
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    //Store the previous direction drawn here. Can't go forward or backward, needs to pick a different direction.
    //Random direction to generate.
    let lastDirection = [],
        randomDirection;

    //Step 1: Random initial position.
    /*let currentRow = randInt(dimensions, "floor");
    currentColumn = randInt(dimensions, "floor");*/
    let currentRow = Math.ceil(mapHeight / 2) - 1;
    let currentColumn = Math.ceil(mapWidth / 2) - 1;

    while (maxTunnels > 0) {
        //Step 2: Random direction.
        //       Do-While for not same direction or opposite it. (Needs to be perpendicular.)
        do {
            //Pick a random direction from array.
            randomDirection = directions[randInt(directions.length - 1)]
        } while (
            //If direction picked is parallel to previous direction, keep generating.
            //              comparing x-coords                  comparing y-coords
            (randomDirection[0] === -lastDirection[0] && randomDirection[1] === -lastDirection[1]) || //<-- opposite direction but parallel; note the "-"
            (randomDirection[0] === -lastDirection[0] && randomDirection[1] === lastDirection[1]) //    <-- same direction.
        );
        //Step 3: Random tunnel length from 1-maxLength
        let randomLength = Math.ceil(Math.random() * maxLength),
            tunnelLength = 0; //tunnelLength is an iterator.

        //Drawing the map:
        //Step 4: Stop drawing if hit edge of map.
        while (tunnelLength < randomLength) {
            //checks each tile.
            if (((currentRow === 0) && (randomDirection[1] === -1)) ||
                ((currentColumn === 0) && (randomDirection[0] === -1)) ||
                ((currentRow === mapHeight - 1) && (randomDirection[1] === 1)) ||
                ((currentColumn === mapWidth - 1) && (randomDirection[0] === 1))) { break; } //Break loop.
            else {
                //Step 5: Update map if everything else is valid.
                mapArray[currentColumn][currentRow] = new PathCell(currentColumn, currentRow); //Update tile
                mapArray[currentColumn][currentRow].initializeCell(); //call internal function to set name.

                currentColumn += randomDirection[0]; //iterate tile
                currentRow += randomDirection[1];
                tunnelLength++;
            }
        }
        //Step 6: Cleanup and update for the next tunnel.
        if (tunnelLength >= 1) {
            lastDirection = randomDirection;
            maxTunnels--;
        }
    }

    return mapArray;
}

//This places specified locations at random positions beside at least one PathCell.
function placeLocation(mapArray, xBound, yBound, centerCoord, roomClass) {

    let pathFound = false;
    while (!pathFound) {
        var randomCoord = [0, 0]; //This, randomly generated, is possible position for location.
        randomCoord[0] = randInt(xBound - 1);
        randomCoord[1] = randInt(yBound - 1);

        //Validate if above position is accessible.
        //check if one of the neighbouring tiles instanceof PathCell.
        for (x = Math.max(0, randomCoord[0] - 1); x <= Math.min(xBound, randomCoord[0] + 1); x++) { //Math.min and Math.max specifies boundaries.
            for (y = Math.max(0, randomCoord[1] - 1); y <= Math.min(yBound, randomCoord[1] + 1); y++) {
                //randomCoord is the chosen location. X, Y are coords around it.
                //Check 1: Not the targeted tile.                      Also not corners. (Only on same plane x, y)
                if ((x != randomCoord[0] || y != randomCoord[1]) && (x == randomCoord[0] || y == randomCoord[1])) {

                    //This is the actual test part. Scalability comes from here!
                    switch (roomClass) {
                        case "Minor":
                            if (mapArray[x][y] instanceof PathCell && (mapArray[randomCoord[0]][randomCoord[1]] instanceof PathCell || mapArray[randomCoord[0]][randomCoord[1]] instanceof WallCell)) {
                                mapArray[randomCoord[0]][randomCoord[1]] = new MinorEncounterCell(randomCoord[0], randomCoord[1]);
                                mapArray[randomCoord[0]][randomCoord[1]].initializeCell();

                                pathFound = true;
                            }
                            break;
                        case "Boss":
                            if ((mapArray[x][y] instanceof PathCell) && (mapArray[randomCoord[0]][randomCoord[1]] instanceof WallCell) && (calcPythagDistance(randomCoord, centerCoord) < 10)) {
                                mapArray[randomCoord[0]][randomCoord[1]] = new BossEncounterCell(randomCoord[0], randomCoord[1]);
                                mapArray[randomCoord[0]][randomCoord[1]].initializeCell();
                                game.roomBossCellEntity = mapArray[randomCoord[0]][randomCoord[1]];

                                pathFound = true;
                            }
                            break;
                    }
                }
            }
        }
    }
    return mapArray;
}

//This takes the completed map array and displays it in the DOM.
function pushMapToDOM(mapArray) { //pass in generation vars
    //createLocations goes here.
    //createRoom();

    //push elements to HTML DOM
    //MUST CLEAR GAMESPACE.CHILDREN BEFORE CALLING.
    for (var i = 0; i < mapArray.length; i++) { //For each row:
        //row div
        let rowDiv = document.createElement("div");
        rowDiv.setAttribute("class", "mapRow");

        for (var j = 0; j < mapArray[0].length; j++) { //For each column:
            let para = document.createElement("p");
            let cellEntity = mapArray[j][i];

            //set ids (coordinates) and classes (type).
            para.setAttribute("id", `[${cellEntity.mapX}][${cellEntity.mapY}]`);
            para.setAttribute("class", "mapCell");

            //Switch all elements' symbols to the obscured symbol in fog.
            let textNode = document.createTextNode(".");

            //append child to each element
            para.appendChild(textNode);
            rowDiv.appendChild(para);
        }
        //append rowdiv to document
        document.getElementById("gamePage__gameSpace__map__canvas").appendChild(rowDiv);
    }
}

//Show cells in vision. This is the fog of war function.
function showCellsInVision(radius) {
    var x = player.mapPosition[0];
    var y = player.mapPosition[1];

    var minBoundX = x - radius,
        maxBoundX = x + radius,
        minBoundY = y - radius,
        maxBoundY = y + radius;
    var tempArray = [];

    //create a tempArray of all the elements in a square range.
    for (var i = 0; i < maxBoundX - minBoundX - 1; i++) {//add each column. Not sure why i have to -1.
        tempArray.push([]);
        for (var j = 0; j < maxBoundY - minBoundY - 1; j++) { //add each cell.
            try { //might be out of bounds.
                tempArray[i].push(mapArray[i + minBoundX + 1][j + minBoundY + 1]);
            } catch (err) {}
        }
    }
    var coordSetCenter = [Math.ceil(tempArray.length / 2) - 1, Math.ceil(tempArray[4].length / 2) - 1];

    //find all the elements in radius range and set symbols to cell.symbol.
    for (var i = 0; i < tempArray.length; i++) {//each column:
        for (var j = 0; j < tempArray[i].length; j++) {
            let tempDistance = calcPythagDistance([i, j], [coordSetCenter[0], coordSetCenter[1]]);

            if (tempDistance < radius) {
                try {
                    let cell = document.getElementById(`[${minBoundX + i + 1}][${minBoundY + j + 1}]`);
                    //Change the map symbol for the tile.
                    cell.innerHTML = mapArray[minBoundX + i + 1][minBoundY + j + 1].symbol;
                    //if this is a special location, give it styles.
                    if (mapArray[minBoundX + i + 1][minBoundY + j + 1] instanceof PathCell == false && mapArray[minBoundX + i + 1][minBoundY + j + 1] instanceof WallCell == false) {
                        cell.style.fontWeight = "700";
                        cell.style.fontStretch = "expanded";
                        cell.style.fontSize = "15px";
                    }
                    //Special case for boss cells.
                    if (mapArray[minBoundX + i + 1][minBoundY + j + 1] instanceof BossEncounterCell) {
                        let tempCellEntity = mapArray[minBoundX + i + 1][minBoundY + j + 1];
                        cell.innerHTML = tempCellEntity.symbol;
                        //Visible case
                        if (tempCellEntity.revealed) {
                            cell.style.fontWeight = "700";
                            cell.style.fontStretch = "expanded";
                            cell.style.fontSize = "22px";
                        } else { //Hidden case
                            cell.style.fontWeight = "400";
                            cell.style.fontStretch = "normal";
                            cell.style.fontSize = "15px";
                        }
                    }
                } catch (err) { }
            }
        }
    }
}

//Put them all together.
function generateNewRoom(room, mapWidth, mapHeight, maxTunnels, maxLength) {
    //generate array of walls
    var mapArray = createMapArray(mapWidth, mapHeight);
    //generate random paths procedurally
    mapArray = createMapPaths(maxTunnels, maxLength, mapWidth, mapHeight, mapArray);
    //generate random locations of interest
    var centerCoord = [(mapWidth - 1) / 2, (mapHeight - 1) / 2];
    for (var i = 0; i < 10; i++) {
        mapArray = placeLocation(mapArray, mapWidth - 1, mapHeight - 1, centerCoord, "Minor");
    }
    //Generate the room's boss
    mapArray = placeLocation(mapArray, mapWidth - 1, mapHeight - 1, centerCoord, "Boss");
    //push complete mapArray to DOM
    pushMapToDOM(mapArray);

    return mapArray;
}