//generate map
function createMapArray(pathSymbols) {
    var array = [];
    for (var i = 0; i < width; i++) {
        array.push([]); //push columns.
        for (var j = 0; j < height; j++) {
            array[i].push(new Cell("Wall", "wall", pathSymbols[0], null, i, j, false)); //push cells.
        }
    }
    return array;
}

//generate paths
function createMap(maxTunnels, maxLength) {
    //very cool directions array! Append each element instead of having 4 switch statements.
    //                [left]   [right] [up]     [down]
    let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    //Store the previous direction drawn here. Can't go forward or backward, needs to pick a different direction.
    //Random direction to generate.
    let lastDirection = [],
        randomDirection;

    //Make the array
    var map = createMapArray(pathSymbols, width, height);
    //Step 1: Random initial position.
    /*let currentRow = randInt(dimensions, "floor");
    currentColumn = randInt(dimensions, "floor");*/
    let currentRow = Math.ceil(height / 2) - 1;
    let currentColumn = Math.ceil(width / 2) - 1;

    while (maxTunnels > 0) {
        //Step 2: Random direction.
        //       Do-While for not same direction or opposite it. (Needs to be perpendicular.)
        do {
            //Pick a random direction from array.
            randomDirection = directions[randInt(directions.length, "floor")]
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
                ((currentRow === height - 1) && (randomDirection[1] === 1)) ||
                ((currentColumn === width - 1) && (randomDirection[0] === 1))) { break; } //Break loop.
            else {
                //Step 5: Update map if everything else is valid.
                map[currentColumn][currentRow] = new Cell("A Desolate Avenue", "path", pathSymbols[1], baseRoomTier, currentColumn, currentRow, false); //Update tile

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
    return map;
}

//generate locations
function createRoom() {
    /*
    Reqs
    - must be bordering at least one path tile ";".
    - must choose which type of location. Some locations should spawn further from center.
    
    1. choose random location
        1.1 check for bordering tile ";"
        1.2 check for position from center
    2. choose random type
        2.1 check quota for type from center
    3. replace in map.

    !, Φ, Σ, σ, ß, &, φ, ‼, 
    ¶§▲▼
    ƒ𝆏𝆑     𝄋      𝅜𝅝𝅗𝅥♩♪𝅘𝅥𝅯𝅘𝅥𝅰𝅘𝅥𝅱𝅘𝅥𝅲    𝄽𝄾𝄿𝅀𝅁𝅂   ♮♯♭𝄪𝄫  𝄐   𝄞𝄢𝄡  𝆃
    ┴Γ╪
    */

    let xBound = map.length;
    let yBound = map[0].length;
    let centerCoord = [Math.ceil(xBound / 2) - 1, Math.ceil(yBound / 2) - 1];

    //How many rooms to generate?
    let class1Rooms = Math.ceil(baseRoomClassNumbers[0] * roomClassMultiplier[0]);
    let class2Rooms = Math.ceil(baseRoomClassNumbers[1] * roomClassMultiplier[1]);
    let class3Rooms = Math.ceil(baseRoomClassNumbers[2] * roomClassMultiplier[2]);
    placeLocation(map, xBound, yBound, centerCoord, 1, class1Rooms);
    placeLocation(map, xBound, yBound, centerCoord, 2, class2Rooms);
    placeLocation(map, xBound, yBound, centerCoord, 3, class3Rooms);

    //Generate the shop.
    map[centerCoord[0]][centerCoord[1]] = new Cell("A Serene Refuge", "shop", "𝄞", null, centerCoord[0], centerCoord[1], true);
}

function placeLocation(map, xBound, yBound, centerCoord, roomClass, number) { //picks a location, checks for tests, places location.
    for (var i = 0; i < number; i++) {
        let pathFound = false;
        while (!pathFound) {
            var randomCoord = [0, 0];
            randomCoord[0] = randInt(xBound - 1, "floor");
            randomCoord[1] = randInt(yBound - 1, "floor");

            //check if one of the neighbouring tiles is ";".
            for (x = Math.max(0, randomCoord[0] - 1); x <= Math.min(xBound, randomCoord[0] + 1); x++) { //Math.min and Math.max specifies boundaries.
                for (y = Math.max(0, randomCoord[1] - 1); y <= Math.min(yBound, randomCoord[1] + 1); y++) {
                    //randomCoord is the chosen location. X, Y are coords around it.
                    //Check 1: Not the targeted tile.                      Also not corners. (Only on same plane x, y)
                    if ((x != randomCoord[0] || y != randomCoord[1]) && (x == randomCoord[0] || y == randomCoord[1])) {
                        //This is the actual test part. Scalability comes from here!
                        switch (roomClass) {
                            case 1: //most common, easy rooms.
                                /*
                                Criteria: closer than 15 tiles, must be beside ";" tile (map[x][y])
                                */
                                if (map[x][y].symbol == ";" && calcPythagDistance(randomCoord, centerCoord) < 15) {
                                    map[randomCoord[0]][randomCoord[1]] = new Cell(nameLocation(1), "minor encounter", roomClassSymbols[0], 1, randomCoord[0], randomCoord[1], false);
                                    pathFound = true;
                                }
                                break;
                            case 2: // harder rooms.
                                /*
                                Criteria: must be beside ";" tile (map[x][y])
                                */
                                if (map[x][y].symbol == ";") {
                                    map[randomCoord[0]][randomCoord[1]] = new Cell(nameLocation(2), "major encounter", roomClassSymbols[1], 2, randomCoord[0], randomCoord[1], false);
                                    pathFound = true;
                                }
                                break;
                            case 3: //boss rooms.
                                /*
                                Criteria: must be beside ";" tile (map[x][y]) and more than 10 tiles away.
                                */
                                if (map[x][y].symbol == ";" && calcPythagDistance(randomCoord, centerCoord) > 15) {
                                    map[randomCoord[0]][randomCoord[1]] = new Cell(nameLocation(3), "boss encounter", roomClassSymbols[2], 3, randomCoord[0], randomCoord[1], true);
                                    pathFound = true;
                                }
                                break;
                        }
                    }
                }
            }
        }
    }
}

function nameLocation(roomClass) {//assign names.
    switch (roomClass) {
        case 1:
            //assign a random name from the names list.
            var index = randInt(class1Names.length, "near");
            if (class1Names[index] == undefined) {
                index -= 1;
            }
            return class1Names[index];
        case 2:
            var index = randInt(class2Names.length, "near");
            if (class2Names[index] == undefined) {
                index -= 1;
            }
            return class2Names[index];
        case 3:
            var index = randInt(class2Names.length, "near");
            if (class3Names[index] == undefined) {
                index -= 1;
            }
            return class3Names[index];
        case 4:
            return "A Serene Refuge";
    }
}

//onload
function generateMap(maxTunnels, maxLength) { //pass in generation vars
    map = createMap(maxTunnels, maxLength);
    //createLocations goes here.
    createRoom();

    //push elements to HTML DOM
    //MUST CLEAR GAMESPACE.CHILDREN BEFORE CALLING.
    for (var i = 0; i < map.length; i++) { //For each row:
        //row div
        let rowDiv = document.createElement("div");
        rowDiv.setAttribute("class", "gameSpace__boardLine");

        for (var j = 0; j < map[0].length; j++) { //For each column:
            let para = document.createElement("p");
            let cellEntity = map[j][i];

            para.setAttribute("id", `[${cellEntity.x}][${cellEntity.y}]`);
            if(cellEntity.type == "path" || cellEntity.type == "wall"){
                para.setAttribute("class", `gameSpace__boardCell`);
            } else {
                para.setAttribute("class", `gameSpace__boardCell gameSpace__specialLocations`);
            }

            let textNode = document.createTextNode(cellEntity.symbol);
            //append child to each element
            para.appendChild(textNode);
            rowDiv.appendChild(para);
        }
        //append rowdiv to document
        document.getElementById("gameSpace").appendChild(rowDiv);
    }
}