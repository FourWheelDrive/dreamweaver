//This creates and fills an array with WallCells.
function createMapArray(mapWidth, mapHeight) {
    var array = [];
    for (var i = 0; i < mapWidth; i++) {
        array.push([]); //push columns.
        for (var j = 0; j < mapHeight; j++) {
            array[i].push(new WallCell("", "#", i, j)); //push cells.
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
            randomDirection = directions[randInt(directions.length-1)]
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
                mapArray[currentColumn][currentRow] = new PathCell("", ";", currentColumn, currentRow); //Update tile
                mapArray[currentColumn][currentRow].getName();

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

function pushMapToDOM(mapArray) { //pass in generation vars
    //map = createMap(maxTunnels, maxLength);
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
            para.setAttribute("id", `[${cellEntity.x}][${cellEntity.y}]`);
            para.setAttribute("class", "mapCell");
            //Switch all elements' symbols to the obscured symbol in fog.
            let textNode = document.createTextNode(cellEntity.symbol);

            //append child to each element
            para.appendChild(textNode);
            rowDiv.appendChild(para);
        }
        //append rowdiv to document
        document.getElementById("gamePage__gameSpace__map").appendChild(rowDiv);
    }
    //calc all visible nodes. Player position begins at center.
    //showCellsInVision(6, Math.ceil(mapWidth / 2) - 1, Math.ceil(mapHeight / 2) - 1);
}