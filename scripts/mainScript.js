//Functions
//DIALOGUE = externalOutput SEQUENCE = outputBar
async function openingDialogue() {
    let tempMessages = [
        "That which represents the world as it is...",
        "...is the metaphysical Will that drives the world of Man."
    ];
    tempMessages.push()
    await externalOutput(tempMessages, null);
}
//Character dialogues
async function snapdragonDialogue() {
    await externalOutput(["snapdragon test 1", "snapdragon test 2"], "The Storied Clairvoyant");
}
async function vernalWitnessDialogue(step) {
    switch(step){
        case "E-2":
            await externalOutput(["More test dialogue."], "The Vernal Witness");
            break;
        case "M-8":
            await externalOutput(["Test Dialogue."], "The Vernal Witness");
            break;
    }
}

//Move sequences----------------------------------------------------------------------------------------------------------------
async function move0Sequence() {
    //Sequence.
    await output("An unfamiliar city stretches into the mist.");
    await output("This parallel mirror is monochrome grey.");
}
async function move1Sequence() {
    await output("The domain of the Will is not a tranquil place.");
    await output("It is a harbour of desire and absent satisfaction.");
    await output("Of throttled dreams and far-flung goals.");
}
async function fight1WinSequence() {
    await output("The Will is powerful, but it can be led astray.");
    await output("Music mends the soul, wards off the worldly troubles.");
    await output("Well-wishes are worth more than gold.");
}
//Life sequences
async function lastLifeSequence() {
    await output("To hide from the world is to deny oneself. Nobody can wear a mask for very long.");
    await output("The masquerade is absolute. Only the abyss awaits beyond.");
}
async function firstDeathSequence() {
    await output("Masquerade increased. A mask, to soothe the wound's sting.")
    await output("Attack power increased. Parry cooldown, duration decreased.");
}


//Output functions---------------------------------------------------------------------------------------
function createOutputBoxes() {
    var number = Math.floor(window.innerHeight / 100);
    var opacity = 1;
    let outputBox = document.getElementById("outputBox");

    for (var i = 0; i < number; i++) { //change this to define according to height later if need be.
        //paragraph.
        let newBox = document.createElement("p");
        newBox.setAttribute("id", `Output ${i}`);
        newBox.setAttribute("class", "outputBoxParagraph");

        if (i == 0) {
            newBox.style.fontWeight = "bold";
        }
        newBox.style.opacity = opacity;

        //text.
        let textNode = document.createTextNode("");

        //append to doc.
        newBox.appendChild(textNode);
        outputBox.appendChild(newBox);

        //push element to array
        mainOutputBoxIds.push(`Output ${i}`);

        //update opacity.
        opacity = opacity - 0.1;
    }
}
async function output(text) {
    //console.log(mainOutputBoxIds)
    for (var i = (mainOutputBoxIds.length - 1); i > 0; i--) {//append the text from each box to the next down. exclude 0 case
        var firstP = document.getElementById(mainOutputBoxIds[i]);
        var secondP = document.getElementById(mainOutputBoxIds[i - 1]);
        firstP.innerHTML = secondP.innerHTML;
    }
    document.getElementById(mainOutputBoxIds[0]).innerHTML = text;
    await fade("in", document.getElementById(mainOutputBoxIds[0])); //cool fade in.
    await sleep(outputPause);
}
async function externalOutput(messages, encounter) {
    var extenalOutputDiv = document.getElementById("externalOutputBox");
    //clear boxes.
    var outputBoxes = [document.getElementById("externalOutputBox__output1"), document.getElementById("externalOutputBox__output2"), document.getElementById("externalOutputBox__output3")];
    for (var i = 0; i < outputBoxes.length; i++) {
        outputBoxes[i].innerHTML = "";
    }
    //fade in.
    document.getElementById("externalOutputBox__encounter").innerHTML = encounter; //update lcoation thingy.
    extenalOutputDiv.style.opacity = 0;
    extenalOutputDiv.style.display = "flex";
    await fade("in", extenalOutputDiv);

    //output messages
    for (var k = 0; k < messages.length; k++) {
        await tempOutputFunction(outputBoxes, messages[k]);
    }

    //fade out.
    await fade("out", extenalOutputDiv);
    extenalOutputDiv.style.display = "none";
    return;

    //tempfunc!-------------------------------------
    async function tempOutputFunction(outputBoxes, message) {
        for (var j = (outputBoxes.length - 1); j > 0; j--) {
            outputBoxes[j].innerHTML = outputBoxes[j - 1].innerHTML;
        }
        outputBoxes[0].innerHTML = message;
        await fade("in", outputBoxes[0]);
        await sleep(outputPause);
    }
}
//Fade
async function fade(operation, element) { //fade elements in/out
    switch (operation) {
        case "in":
            var newOpacity = 0;
            element.style.opacity = newOpacity;
            var timer = setInterval(function () {
                //if animation is done
                if (element.style.opacity > 1) {
                    clearInterval(timer);
                } else {
                    element.style.opacity = newOpacity;
                    newOpacity += 0.01;
                }
            }, 10)
            await sleep(1000);
            break;
        case "out":
            var newOpacity = 1;
            element.style.opacity = newOpacity;
            var timer = setInterval(function () {
                //if animation is done
                if (element.style.opacity < 0) {
                    clearInterval(timer);
                } else {
                    element.style.opacity = newOpacity;
                    newOpacity -= 0.01;
                }
            }, 10)
            await sleep(1000);
            break;
    }
}
/* control functions.
//Toggle control functions
function showControls() {
    document.getElementById("controlsPanel").style.display = "flex";
}
function hideControls() {
    document.getElementById("controlsPanel").style.display = "none";
}*/

//Dialogue sequence handler-----------------------------------------------------------------------------------
/*Cases:
1) roomClear event. Check game.currentRoom to figure out which boss was beat.
2) story event on moves. Check game.moveCounter.
3) story event on fights. Check game.encounterCounter.
*/
async function storyDialogueHandler(proc) {
    game.movesLocked = true;

    if (proc == "roomClear") { //when boss is defeated and room cleared.
        switch (game.currentRoom - 1) {//currentRoom has already been iterated.
            case 1:
                await snapdragonDialogue();
                break;
        };
    }

    if (proc == "storyMove") { //occurs after moves.
        switch (game.moveCounter) {
            case 8:
                await vernalWitnessDialogue("M-8");
                break;
        }
    }

    if (proc == "storyEncounter") { //occurs after encounters.
        switch (game.encounterCounter) {
            case 2:
                await vernalWitnessDialogue("E-2");
                break;
        }
    }

    game.movesLocked = false;
}

//win a room
async function roomCleared() {
    //Fade out to do all the stuff.
    await fade("out", document.getElementById("mainGameGrid"));
    //-------------------|There could be a dialogue here!|-----------------------------------
    //update room multipliers.
    roomClassMultiplier = [roomClassMultiplier[0] * 1.5, roomClassMultiplier[1] * 1.2, 1];
    baseRoomTier++;
    game.currentRoom++;

    //Clear the map and the board.
    map = [];
    var gameMap = document.getElementById("gameSpace");
    while (gameMap.firstChild) {
        gameMap.removeChild(gameMap.lastChild);
    }
    //Remake a new map!
    generateMap(width, height, 70, 15);
    //reset player position.
    playerX = Math.ceil(globalWidth / 2) - 1;
    playerY = Math.ceil(globalHeight / 2) - 1;

    //Rebind hover listener to all new tiles.
    var boardRows = document.getElementById("gameSpace").children;
    setHoverListener(boardRows);

    //Room-dependent dialogues.
    await storyDialogueHandler("roomClear");

    //Fade back in.
    await fade("in", document.getElementById("mainGameGrid"));
}

//Game functions-----------------------------------------------------------------------------------
function loseGame() {
    //set sessionstorage.result
    sessionStorage.setItem("result", "lose");
    window.location.href = "results.html";
}
function winGame() { //same thing as loseGame(), but win.
    sessionStorage.setItem("result", "win");
    window.location.href = "results.html";
}

//Shop functions-----------------------------------------------------------------------------------
function initializeShop(){//this is the same algorithm that the player's inventory uses to update, actually.
    var shopMenu = document.getElementById("shopDisplay__menu");
    //remove the buttons already on the display first.
    while (shopMenu.firstChild) {
        shopMenu.removeChild(shopMenu.lastChild);
    }

    //add new items to game.shopInventory.
    let baseShopItems = 4;
    for(var i = 0; i < baseShopItems + game.currentRoom; i++){//as you progress through rooms, there are more items in shop.
        game.shopInventory.push(returnRandomItem());
    }
    console.log(game.shopInventory)

    //Make new buttons for the shop.
        for (var j = 0; j < game.shopInventory.length; j++) {
            var button = document.createElement("button");
            if (j == 0) {
                button.innerHTML = `> ${game.shopInventory[j].name} <`;
                document.getElementById("shopDisplay__output__outputDisplay").innerHTML = game.shopInventory[j].description;
            } else {
                button.innerHTML = game.shopInventory[j].name;
            }
    
            button.setAttribute("id", `shop button ${j}`);
            button.setAttribute("class", `shopDisplay__menu__button`);
    
            shopMenu.appendChild(button);
        }
}
function openShop(operation){
    if (operation == "open"){
        game.attacksLocked = true;
        game.movesLocked = true;

        //default shop position
        shopPosition = 0;
        document.getElementById("shopDisplay").style.display = "grid";
    }
    if (operation == "close"){
        game.attacksLocked = false;
        game.movesLocked = false;

        document.getElementById("shopDisplay").style.display = "none";

        if (game.shopInventory.length > 0) { //reset outputbar.
            shopPosition = 0;
            document.getElementById("shopDisplay__output__outputDisplay").innerHTML = player.inventory[0].description;
        } else {
            document.getElementById("shopDisplay__output__outputDisplay").innerHTML = "";
        }
    }
}

//onload
async function onLoad() {
    //document.getElementById("shopDisplay").style.display = "grid";

    await openingDialogue();
    await fade("in", document.getElementById("mainGameGrid"));

    console.log("this is working");
    createOutputBoxes();
    await move0Sequence();

    let gameSpace = document.getElementById("gameSpace");
    gameSpace.style.opacity = 0;
    generateMap(70, 15);

    //initializeShop();

    await fade("in", gameSpace);
    initPlayerScript(mapWidth, mapHeight);
}