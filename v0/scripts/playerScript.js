//UI vars
function setHoverListener(boardRows) {
    for (var i = 0; i < boardRows.length; i++) { //for each row div:
        let rowCells = boardRows[i].children;
        for (var j = 0; j < rowCells.length; j++) { //for each column cell in a row:
            let cell = rowCells[j];
            cell.addEventListener("mouseover", function () { //this updates the display according to cell id.
                let tempPosition = cell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1); //get cell coords
                if (cell.classList.contains("gameSpace__specialLocations") && !map[tempPosition[0]][tempPosition[1]].obscured) { //if the special location is in vision:
                    let cellPosition = cell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
                    document.getElementById("uiGrid__header__hoverDisplay").innerHTML = map[cellPosition[0]][cellPosition[1]].name;
                } else { //else just display coords.
                    document.getElementById("uiGrid__header__hoverDisplay").innerHTML = `${cell.id}`;
                }
            })
        }
    }
}

function drawPlayer(boardRows) {
    let rowCells = boardRows[(playerY)].children;

    let cell = rowCells[playerX];

    cell.innerHTML = "@";
    //Update styles too! :)
    cell.style.fontSize = "15px";
    cell.style.fontWeight = "900";
    cell.style.opacity = 1;
}

//Keydown handlers
async function keyDownHandler(e) {
    //If keys are pressed for movement AND not in an encounter AND not held down:
    if ((e.code == "KeyW" || e.code == "KeyA" || e.code == "KeyS" || e.code == "KeyD") && !game.movesLocked && !e.repeat) {
        let boardRows = document.getElementById("gameSpace").children;
        //very cool directions array! Append each element instead of having 4 switch statements.
        //[left] [right] [up] [down]
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]],
            newDirection;
        //Cells to update
        let rowCells = boardRows[(playerY)].children;
        let currentCell = rowCells[playerX],
            nextCellPos;
        //Make an array [x][y] of position. .filter removes whitespace from split.
        let currentCellPos = currentCell.id.split(/[\[\]]/).filter(element => element.length >= 1);
        let currentCellEntity = map[currentCellPos[0]][currentCellPos[1]];
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

        //Updating to find next cell coordinates.
        nextCellPos = [parseInt(currentCellPos[0]) + newDirection[0], parseInt(currentCellPos[1]) + newDirection[1]];
        let newCell, newCellEntity;

        if ((nextCellPos[0] <= globalWidth && nextCellPos[1] <= globalHeight) && (nextCellPos[0] >= 0 && nextCellPos[1] >= 0)) { //check for out of bounds. //Not working.
            newCell = document.getElementById(`[${nextCellPos[0]}][${nextCellPos[1]}]`);
            let tempPosition = newCell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
            newCellEntity = map[tempPosition[0]][tempPosition[1]];
        }

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
                if (currentCellEntity.type == "minor encounter" || currentCellEntity.type == "major encounter" || currentCellEntity.type == "boss encounter"){
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
            } else if (game.movesSinceLastRandomEncounter >= 5){
                //Random chance for encounters on untread path tiles.
                let tempChance = playerRandInt(1, game.randomEncounterChance, "floor"); //Maybe add other events too?
                console.log(tempChance)
                if (newCellEntity.type == "path" && !newCellEntity.alreadyVisited && tempChance == 1) {
                    game.movesSinceLastRandomEncounter = 0;
                    await beginEncounter(newCellEntity);
                }
                newCellEntity.alreadyVisited = true;
            }
        }
    }
    //If keys are pressed for attack: Actually redirected to buttonPressHandler.
    if ((e.code == "KeyJ" || e.code == "KeyK") && !game.attacksLocked) {//Clicking encounter buttons also redirects here.
        switch (e.code) {
            case "KeyJ": //regular attack
                if (!player.atkOnCD) {
                    //Do button things.
                    document.getElementById("encounterDialogue__menu__attackButton").click();
                }
                break;
            case "KeyK": //parry
                if (!player.parryOnCD) {
                    //Do button things.
                    document.getElementById("encounterDialogue__menu__parryButton").click();
                }
                break;
        }
    }
    //Toggle inventory.
    if (e.code == "KeyG" && !e.repeat) {
        switch (game.inventoryOpen) {
            case true: //if inv is open, close it.
                //pause and unlock EVERYTHING.
                if (enemy.health > 0) { //if there is an encounter. Enemy is not dead.
                    game.attacksLocked = false;
                }
                game.movesLocked = false;
                game.inventoryOpen = false;

                document.getElementById("inventoryDisplay").style.display = "none";
                if (player.inventory.length > 0) { //reset outputbar.
                    inventoryPosition = 0;
                    document.getElementById("inventoryDisplay__output").innerHTML = player.inventory[0].description;
                } else {
                    document.getElementById("inventoryDisplay__output").innerHTML = "";
                }
                break;
            case false: //if inv is closed, open it.
                //pause and lock EVERYTHING.
                game.attacksLocked = true;
                game.movesLocked = true;
                game.inventoryOpen = true;

                //default position.
                inventoryPosition = 0;

                document.getElementById("inventoryDisplay").style.display = "grid";
                break;
        }
    }
    //Close shop.
    if (e.code == "KeyH" && game.shopOpen) {
        openShop("close");
    }
    if (game.inventoryOpen && (e.code == "ArrowUp" || e.code == "ArrowDown" || e.code == "Enter")) { //use a pointer to maneuver between inventory items.
        switch (e.code) {
            case "ArrowUp":
                if ((inventoryPosition - 1) >= 0 && player.inventory.length > 1) {
                    inventoryPosition = inventoryPosition - 1;
                    //Change new button at pos (right)
                    let newButtonEntity = document.getElementById(`inventory button ${inventoryPosition}`);
                    newButtonEntity.innerHTML = `> ${newButtonEntity.innerHTML} <`;
                    newButtonEntity.scrollIntoView({ behaviour: "smooth", block: "nearest" });
                    //need to reset the other button.
                    let previousButtonEntity = document.getElementById(`inventory button ${inventoryPosition + 1}`);
                    previousButtonEntity.innerHTML = previousButtonEntity.innerHTML.slice(5, -5); //splice 5, -5 because > and < have esc chars.

                    //update output.
                    document.getElementById("inventoryDisplay__output").innerHTML = player.inventory[inventoryPosition].description;
                }
                break;
            case "ArrowDown":
                if ((inventoryPosition + 1) < player.inventory.length && player.inventory.length > 1) {
                    inventoryPosition = inventoryPosition + 1;
                    //change new button at pos (left)
                    let newButtonEntity = document.getElementById(`inventory button ${inventoryPosition}`);
                    newButtonEntity.innerHTML = `> ${newButtonEntity.innerHTML} <`;
                    newButtonEntity.scrollIntoView({ behaviour: "smooth", block: "nearest" });
                    //need to reset the other button.
                    let previousButtonEntity = document.getElementById(`inventory button ${inventoryPosition - 1}`);
                    previousButtonEntity.innerHTML = previousButtonEntity.innerHTML.slice(5, -5);

                    //update output
                    document.getElementById("inventoryDisplay__output").innerHTML = player.inventory[inventoryPosition].description;
                }
                break;
            case "Enter":
                if (player.inventory.length > 0) { //if inventory has 1+ items
                    if (document.getElementById("inventoryDisplay__output").innerHTML.includes("Confirm: ENTER")) { //confirmation prompt.
                        document.getElementById("inventoryDisplay__output").innerHTML = "";
                        player.useInventoryItem(inventoryPosition);

                        //reset pos
                        inventoryPosition = 0;
                        if(player.inventory.length > 0){
                            let firstButton = document.getElementById(`inventory button ${inventoryPosition}`);
                            //firstButton.innerHTML = `> ${firstButton.innerHTML} <`;
                            firstButton.scrollIntoView({ behaviour: "smooth", block: "nearest" });
                        }
                    } else {
                        document.getElementById("inventoryDisplay__output").innerHTML = `Use ${player.inventory[inventoryPosition].name}? Confirm: ENTER`
                    }
                }
                break;
        }
    }
    if (game.shopOpen && (e.code == "ArrowUp" || e.code == "ArrowDown" || e.code == "Enter")) { //pointer, but for shop items. same alg.
        switch (e.code) {
            case "ArrowUp":
                if ((shopPosition - 1) >= 0 && game.shopInventory.length > 1) {
                    shopPosition = shopPosition - 1;
                    //update new button
                    let newButtonEntity = document.getElementById(`shop button ${shopPosition}`);
                    newButtonEntity.innerHTML = `> ${newButtonEntity.innerHTML} <`;
                    newButtonEntity.scrollIntoView({ behaviour: "smooth", block: "nearest" });

                    //update previous button
                    let previousButtonEntity = document.getElementById(`shop button ${shopPosition + 1}`);
                    previousButtonEntity.innerHTML = previousButtonEntity.innerHTML.slice(5, -5);

                    //update things.
                    let newShopItem = game.shopInventory[shopPosition];
                    document.getElementById("shopDisplay__output__outputDisplay").innerHTML = newShopItem.description;
                    document.getElementById("shopDisplay__output__costDisplay").innerHTML = `Will consume: ${newShopItem.cost} wishes`;
                }
                break;
            case "ArrowDown":
                if ((shopPosition + 1) < game.shopInventory.length && game.shopInventory.length > 1) {
                    shopPosition = shopPosition + 1;
                    //update new button
                    let newButtonEntity = document.getElementById(`shop button ${shopPosition}`);
                    newButtonEntity.innerHTML = `> ${newButtonEntity.innerHTML} <`;
                    newButtonEntity.scrollIntoView({ behaviour: "smooth", block: "nearest" });

                    //update previous button
                    let previousButtonEntity = document.getElementById(`shop button ${shopPosition - 1}`);
                    previousButtonEntity.innerHTML = previousButtonEntity.innerHTML.slice(5, -5);

                    //update things.
                    let newShopItem = game.shopInventory[shopPosition];
                    document.getElementById("shopDisplay__output__outputDisplay").innerHTML = newShopItem.description;
                    document.getElementById("shopDisplay__output__costDisplay").innerHTML = `Will consume: ${newShopItem.cost} wishes`;
                }
                break;
            case "Enter":
                if (!game.inventoryOpen) {
                    let outputDisplay = document.getElementById("shopDisplay__output__outputDisplay");
                    //Purchase confirmed:
                    if (outputDisplay.innerHTML.includes("Confirm: ENTER")) {
                        if (player.wishes >= game.shopInventory[shopPosition].cost) {
                            outputDisplay.innerHTML = "";

                            //add to inventory and remove wishes.
                            player.appendToInventory(game.shopInventory[shopPosition]);
                            player.consumeWishes(game.shopInventory[shopPosition].cost);
                            //remove from shop.
                            game.shopInventory.splice(shopPosition, 1);
                            //remove button.
                            refreshShop(); //can't actually just .removeChild, because IDs get messed up.

                            //reset position.
                            shopPosition = 0;
                            if(game.shopInventory.length > 0){
                                let firstButton = document.getElementById(`shop button ${shopPosition}`);
                                //firstButton.innerHTML = `> ${firstButton.innerHTML} <`;
                                firstButton.scrollIntoView({ behaviour: "smooth", block: "nearest" });
                            }
                        } else { //if not enough money.
                            outputDisplay.innerHTML = "Well-wishes are not freely given.";
                        }
                    } else {
                        //confirm purchase?
                        outputDisplay.innerHTML = `Buy ${game.shopInventory[shopPosition].name}? Confirm: ENTER`;
                    }
                }
                break;
        }
    }
    if (!game.inventoryOpen && e.code == "Enter") { //return buttons click.
        document.getElementById("encounterVictoryDialogue__returnButton").click();
    }
}
//Button handlers. Attacks from keyDownHandler redirected here.
async function buttonPressHandler(e) {
    e = e || window.event; //different event handlers.
    var buttonId = e.currentTarget.id;

    //encounter buttons, set cooldown and timer.
    switch (buttonId) {
        case "encounterDialogue__menu__attackButton":
            if (!player.atkOnCD) {//do attack.
                player.atkOnCD = true;
                player.attackTarget(enemy)
                setTimeout(function () { player.atkOnCD = false; }, player.attacks[0].cooldown * 1000);

                procButtonCooldownTimer(buttonId, player.attacks[0].cooldown); //animation.
            }
            break;
        case "encounterDialogue__menu__parryButton":
            if (!player.parryOnCD) {
                player.parryOnCD = true;
                player.parry()
                setTimeout(function () { player.parryOnCD = false; }, player.attacks[1].cooldown * 1000);
                procButtonCooldownTimer(buttonId, player.attacks[1].cooldown);
            }
            break;
        //This returnButton case also starts dialogue sequences at the end of important encounters!!
        case "encounterVictoryDialogue__returnButton": //the return to map button.
            //boss fights have been handled in win encounter script.
            hideEncounterDialogue();
            //Old dialogue handler.
            /*if (game.storyDialogueEncounters.includes(game.encounterCounter)) {
                await storyDialogueHandler("storyEncounter");
            }*/

            break;
    }
}

//Encounter------------------------------------------------------------------------------------------------------------------
//If the player walks into an encounter, start encounterScript. This initializes vars, sets up room, calls encounterFunctionWrapper for the first time.
async function beginEncounter(cellEntity) { //CELLENTITY, NOT CELL.
    game.movesLocked = true; //Enable J, K keybinds for attacks. Disable movement.

    //set up the encounter here. Class 1, 2, 3 rooms, from top to bottom.
    //Choose a random number of enemies to be in each room, within a certain range according to room.
    var enemiesInRoom;
    switch (cellEntity.type) {
        case "minor encounter":
            enemiesInRoom = 2;
            break;
        case "major encounter":
            enemiesInRoom = 3;
            break;
        case "boss encounter":
            enemiesInRoom = 5;
            break;
        case "path": //random path encounters.
            enemiesInRoom = 1;
            break;
    }
    encounterFunctionWrapper(cellEntity, enemiesInRoom, 1);
    return;
}
//Contains: set up for loot, boss entity creation and dialogue setup.
//Also contains: Victory condition, room progression
async function encounterFunctionWrapper(cellEntity, enemiesInRoom, currentEnemyIterator) {//callback function. Runs when each fight is done, if there are more enemies left in the room.
    //Exit encounter if all enemies dead.
    if (currentEnemyIterator > enemiesInRoom) {
        winEncounter(cellEntity, enemiesInRoom);
        return;
    }
    //get canvas ready
    var canvas = document.getElementById("encounterDialogue__displaySpace__canvas");
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //display encounter window
    document.getElementById("encounterDialogue").style.display = "grid";
    document.getElementById("encounterDialogue__header__locationDisplay").innerHTML = cellEntity.name;

    var encounterDialogueBox = document.getElementById("encounterDialogue__output__outputBox");
    //------------------------------------------------Case for bosses--------------------------------------------------------||
    if (cellEntity.type == "boss encounter") {
        switch (game.currentRoom) { //switch for specific boss rooms.
            case 1: //First room.
                //Set boss room enemies. These have special names?
                enemy = createNewEnemy(baseRoomTier);
                //On certain enemies in boss room, there are even specialer enemies.
                //The Keeper.
                if (currentEnemyIterator == 2) {
                    enemy = createNewEnemy("X-1", "The Keeper");
                }
                //The Clairvoyant. Clairvoyant is the boss at the end.
                if (currentEnemyIterator == enemiesInRoom) {
                    enemy = createNewEnemy("X-1", "The Clairvoyant");

                    let bossDialogueSequence = [];
                    bossDialogueSequence = ["The Storied Clairvoyant scowls.", "Too intent.", "Too uncertain.", "Too naive."]
                    //boss dialogue sequences.
                    for (var j = 0; j < bossDialogueSequence.length; j++) {
                        if (j == 0) {
                            await sleep(outputPause);
                        }
                        encounterDialogueBox.innerHTML = bossDialogueSequence[j];
                        await fade("in", encounterDialogueBox);
                        await sleep(outputPause);
                        await fade("out", encounterDialogueBox);
                        await sleep(outputPause);
                    }
                }

                //not boss dialogue sequences.
                if (enemy.name != "The Storied Clairvoyant") {
                    //Dialogue sequences before fights.
                    var encounterDialogueBox = document.getElementById("encounterDialogue__output__outputBox");
                    encounterDialogueBox.innerHTML = enemy.encounterDialogue;
                    await sleep(outputPause);
                }
                break;
        }
    } else if (cellEntity.type == "minor encounter" || cellEntity.type == "major encounter" || cellEntity.type == "path") {
        //--------------------------------------------Case for others-------------------------------------------------------||
        //create enemy (from enemiesListScript.js)
        enemy = createNewEnemy(baseRoomTier);

        //Start dialogue.
        //Dialogue sequences before fights.
        var encounterDialogueBox = document.getElementById("encounterDialogue__output__outputBox");
        encounterDialogueBox.innerHTML = enemy.encounterDialogue;
        await sleep(outputPause);
    }

    //reset dialoguebox.
    encounterDialogueBox.innerHTML = "";
    encounterDialogueBox.style.opacity = 1;
    //Begin fight.
    if (!game.inventoryOpen) { //sometimes it gets inted by starting a fight while inv open.
        game.attacksLocked = false; //Enable J, K keybinds for attacks. Disable movement.
    }
    var encounterAnimation = window.requestAnimationFrame(function () { drawEncounter(ctx, canvas, enemy, encounterAnimation, function () { return encounterFunctionWrapper(cellEntity, enemiesInRoom, currentEnemyIterator + 1); }) });
}
//Contains: Lose condition, victory dialogue.
async function drawEncounter(ctx, canvas, enemy, animation, callback) {
    //Update text.
    const enemyXOriginal = enemy.x;
    const playerXOriginal = player.x;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.font = "15px Didot, serif";
    ctx.fillText("@", player.x, player.y);
    ctx.fillText("‼", enemy.x, enemy.y);

    ctx.font = "10px Didot, serif";
    ctx.fillText(player.statusLine, playerXOriginal, player.y + 15);
    ctx.fillText(enemy.statusLine, enemyXOriginal, enemy.y + 15);

    ctx.fillText(player.action, playerXOriginal, player.y + 30);
    ctx.fillText(enemy.action, enemyXOriginal, enemy.y + 30);

    //Check for win/loss condition-----------------------------------------------------------------------------------------
    if (player.health <= 0 || enemy.health <= 0) {
        game.attacksLocked = true;//fight keys locked.
        window.cancelAnimationFrame(animation); //stop animation. Win condition.
        if (enemy.health <= 0) {
            document.getElementById("encounterDialogue__output__outputBox").innerHTML = enemy.deathDialogue;
            await sleep(outputPause);
        }
        if (player.health <= 0) { //Lose condition
            loseEncounter();
            return;
        }

        //only callback if the enemy is dead, and not the player.
        document.getElementById("encounterDialogue").style.display = "none"; //hide frame.
        document.getElementById("encounterDialogue__output__outputBox").innerHTML = ""; //clear output.
        callback();
    } else {
        //Continue frame if nobody is dead.--------------------------------------------------------------------------------
        //Enemy attacks.
        if (!enemy.atkOnCD && !game.inventoryOpen) {
            enemy.atkOnCD = true;
            enemy.attackTarget(player)
            setTimeout(function () { enemy.atkOnCD = false; }, enemy.atkCD * 1000);
        }
        //request next frame.
        window.requestAnimationFrame(function () { drawEncounter(ctx, canvas, enemy, animation, callback) });
    }
}
//Hides encounter dialogue, after all is done.
function hideEncounterDialogue() {
    document.getElementById("encounterVictoryDialogue").style.display = "none";
    game.movesLocked = false; //not in combat any more.
    game.attacksLocked = true;
}
//Lose a life. Seperated function for ease of read. Contains: Masquerade update, death dialogue.
async function loseEncounter() {
    //iterate deathCounter.
    game.deathCounter++;

    document.getElementById("encounterDialogue__output__outputBox").innerHTML = `The world fades away.`;
    await sleep(outputPause);

    //fade out and fade back in effect. After the fade, do all the map updates and stuff.-----------------------------
    await fade("out", document.body);
    await sleep(3000);

    //hide frame and clear output.
    document.getElementById("encounterDialogue").style.display = "none";
    document.getElementById("encounterDialogue__output__outputBox").innerHTML = "";

    //Move the player back to the center. Change the tile the player was on back to what it was.
    //Revert current tile.
    let currentCell = document.getElementById(`[${playerX}][${playerY}]`);
    let tempPos = currentCell.id.replaceAll("[", "$").replaceAll("]", "$").split("$").filter(element => element.length >= 1);
    let currentCellEntity = map[tempPos[0]][tempPos[1]];
    currentCell.innerHTML = currentCellEntity.symbol;
    if (currentCell.classList.contains("gameSpace__specialLocations")) { //special locations get big.
        currentCell.style.fontSize = "20px";
    } else { //normal locations get font-weighted.
        currentCell.style.fontWeight = "400";
    }

    //Move player.
    playerX = Math.ceil(globalWidth / 2) - 1;
    playerY = Math.ceil(globalHeight / 2) - 1;
    //update new cell's style.
    document.getElementById(`[${playerX}][${playerY}]`).style.fontWeight = "900";
    document.getElementById(`[${playerX}][${playerY}]`).style.opacity = 1;

    player.masqueradeUpdateLives(1); //update lives. Also updates stats! The health update is in here.
    //lose the game if Masquerade is out of bounds.
    if (player.masquerade > player.masqueradeSymbols.length - 1) {
        loseGame();
        return;
    }

    await fade("in", document.body);
    await sleep(3000);
    //Now begin new dialogues.-----------------------------------------------------------------------------------------

    //Begin death dialogue, if necessary.
    if (game.deathCounter == 1) { //for first deaths.
        await firstDeathSequence();
    }
    if (player.masquerade == player.masqueradeSymbols.length - 1) { //Player on last life.
        await lastLifeSequence();
    }

    //return to movement phase.
    game.movesLocked = false;
    game.attacksLocked = true;
}
//Win a fight!
async function winEncounter(cellEntity, enemiesInRoom) {
    //Update the alreadyVisited if the fight on this cell is won.
    cellEntity.alreadyVisited = true;
    game.encounterCounter++;
    //display victory dialogue.
    let victoryDialogue = document.getElementById("encounterVictoryDialogue");

    /*WHY CAN'T I GET SIZE RIGHT REEEEEEEEEE
    let encounterDialogue = document.getElementById("encounterDialogue");

    let rect = encounterDialogue.getBoundingClientRect();
    //set same size as encounter dialogue. no "auto" here.
    victoryDialogue.style.width = rect.width;
    victoryDialogue.style.height = rect.height;
    console.log(victoryDialogue.style.width);
    */

    //If the encounter that was just defeated was the room's boss:
    if (cellEntity.type == "boss encounter") {
        //roomCleared(); go to next room. But for this project:
        winGame();
    }

    victoryDialogue.style.display = "grid";

    let tempWishes = enemiesInRoom; //Might somewhat randomize these.
    player.addWishes(tempWishes); //update wishes!

    document.getElementById("encounterVictoryDialogue__output__message").innerHTML = "A stranger becomes a well-wisher."; //might be randomized.
    document.getElementById("encounterVictoryDialogue__header__locationDisplay").innerHTML = cellEntity.name;
    document.getElementById("encounterVictoryDialogue__output__loot").innerHTML = `Got ${tempWishes} Wishes!`;
    document.getElementById("encounterVictoryDialogue__returnButton").innerHTML = "Gratitude is honour.";
    return;
}

//other funtions---------------------------------------------------------------------------------------------------------------
function setupCanvas(canvas) {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1;
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    canvas.width = 300 * dpr;
    canvas.height = 100 * dpr;
    var ctx = canvas.getContext('2d');

    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    ctx.scale(dpr, dpr);
}

//onload------------------------------------------------------------------------------------------------------------------------
function initPlayerScript(width, height) {
    var boardRows = document.getElementById("gameSpace").children;
    setHoverListener(boardRows);

    player = new Player(20); //create a new player.
    //Give player base attacks.
    player.addNewAttack(new attack("Literature of the Heart", 20, 2, 1, "attack", null, null));
    player.addNewAttack(new attack("Token of Will", null, 5, null, "parry", 3, null));
    //test inventory
    player.appendToInventory(createNewItem("DRAGON-T"));
    player.appendToInventory(createNewItem("HEALTH-C"));
    //set global vars
    playerX = Math.ceil(width / 2) - 1;
    playerY = Math.ceil(height / 2) - 1;

    globalWidth = width;
    globalHeight = height;

    //Input handler.
    document.addEventListener("keydown", keyDownHandler, false);

    //Set up canvas.
    var canvas = document.getElementById("encounterDialogue__displaySpace__canvas");
    setupCanvas(canvas);

    //draw.
    setInterval(drawPlayer, 10, boardRows);
}