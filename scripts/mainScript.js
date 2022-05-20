//Functions
//Sequences:
async function openingSequence() {
    await externalOutput(["That which represents the being-in-itself...", "...is the Will that drives the world."]);
}

//Move sequences
async function move0Sequence() {
    //Sequence.
    await output("This realm is grey.");
    await output("The city stretches into the mist.");
}
async function move1Sequence() {
    await output("The home of the Will is not a tranquil place.");
    await output("It is a harbour of desire and absent satisfaction.");
    await output("Of throttled dreams and far-flung goals.");
}
async function fight1WinSequence() {
    await output("The Will is a powerful thing, but it can be led astray.");
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

//Character sequences
async function snapdragonSequence() {
    await externalOutput(["snapdragon test 1", "snapdragon test 2"])
}

//Victory sequence -> boss sequence
async function clearRoomSequence() {
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
    switch (game.currentRoom - 1) {//currentRoom has already been iterated.
        case 1:
            await snapdragonSequence();
            break;
        case 2:
            break;
    };

    //Fade back in.
    await fade("in", document.getElementById("mainGameGrid"));
}

//Output functions
function createOutputBoxes() {
    var number = Math.floor(window.innerHeight/100);
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
async function externalOutput(messages) {
    var extenalOutputDiv = document.getElementById("externalOutputBox");
    //clear boxes.
    var outputBoxes = [document.getElementById("externalOutputBox_output1"), document.getElementById("externalOutputBox_output2"), document.getElementById("externalOutputBox_output3")];
    for (var i = 0; i < outputBoxes.length; i++) {
        outputBoxes[i].innerHTML = "";
    }
    //fade in.
    extenalOutputDiv.style.opacity = 0;
    extenalOutputDiv.style.display = "flex";
    await fade("in", extenalOutputDiv);

    //output messages
    for (var k = 0; k < messages.length; k++) {
        await tempOutputFunction(outputBoxes, messages[k]);
    }

    //fade out.
    await fade("out", extenalOutputDiv);
    document.getElementById("externalOutputBox").style.display = "none";
    return;

    //tempfunc!-------------------------------------
    async function tempOutputFunction(outputBoxes, message) {
        for (var j = (outputBoxes.length - 1); j > 0; j--) {
            outputBoxes[j].innerHTML = outputBoxes[j - 1].innerHTML;
        }
        outputBoxes[0].innerHTML = message;
        fade("in", outputBoxes[0]);
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


//Game functions
function loseGame() {
    window.location.href = "loseResult.html";
}
function winGame() { }

//onload
async function onLoad() {
    let gameSpace = document.getElementById("gameSpace");
    gameSpace.style.opacity = 0;
    generateMap(70, 15);

    await openingSequence();
    await fade("in", document.getElementById("mainGameGrid"));

    console.log("this is working");
    createOutputBoxes();
    await move0Sequence();

    await fade("in", gameSpace);
    initPlayerScript(width, height);
}