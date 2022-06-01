//Classes----------------------------------------------------------------------||
//Player
class Entity {
    constructor(health) {
        this.health = health;
        this.action = "";
        this.statusLine = `Health: ${this.health}`;

        this.atkOnCD = false;
        this.y = 50;
    }
}
class Player extends Entity {
    constructor(health) {
        super(health);
        this.baseHealth = health;
        this.attacks = []; //array of possible actions. actions are class attack.
        this.x = 50;
        this.masquerade = 0;
        //symbols: ⣀ ⣄ ⣤ ⣦ ⣶
        //this.masqueradeSymbols = ["⣀⣀⣀⣀⣀", "⣶⣶⣶⣶⣶"]; //testing lives.
        this.masqueradeSymbols = ["⣀⣀⣀⣀⣀", "⣤⣄⣀⣀⣀", "⣦⣤⣄⣀⣀", "⣶⣶⣦⣤⣄", "⣶⣶⣶⣦⣤", "⣶⣶⣶⣶⣶"]; //length of this array is how many lives one has.

        this.parryOnCD = false;
        this.inventory = [];

        this.wishes = 0;
        document.getElementById("uiGrid__header__healthDisplay").innerHTML = `Health: ${this.health}`;
        document.getElementById("uiGrid__header__soloistDisplay").innerHTML = `Masquerade: ${this.masqueradeSymbols[this.masquerade]}`
    }
    //setup
    addNewAttack(attack) {
        this.attacks.push(attack);
    }

    //Encounter methods.
    addWishes(newWishes) {
        this.wishes += newWishes;
        document.getElementById("uiGrid__header__wishesDisplay").innerHTML = `Wishes: ${this.wishes}`;
    }
    async attackTarget(target) {
        if (this.health > 0) { //stops from changing after death.
            this.action = "attacking";
            await sleep(1000);
            if (this.health > 0 && this.action == "attacking") { //need to check again. Might have died during the await sleep.
                target.takeDamage(this.attacks[0].damage);
                document.getElementById("encounterDialogue__output__outputBox").innerHTML = `Hit enemy for ${this.attacks[0].damage}`;
            }
            this.action = "";
        }
    }
    async parry() {
        this.action = "parrying";
        await sleep(this.attacks[1].effectDuration * 1000);
        this.action = "";
    }
    takeDamage(damage) {
        this.health -= damage
        this.statusLine = `Health: ${this.health}`;
        document.getElementById("uiGrid__header__healthDisplay").innerHTML = `Health: ${this.health}`;
    }

    //Inventory methods.
    appendToInventory(item) {
        this.inventory.push(item);
        updateInventoryDisplay();
    }
    useInventoryItem(index) {
        //use the item lol
        switch(this.inventory[index].id){ //ID goes here. CHECK entityDatabase.js for these.
            case "DRAGON-T": //Dragon Talisman.
                break;
            case "HEALTH-C":
                break;
        }

        //output and delete from inv.
        console.log(`used ${this.inventory[index].name}!`);
        this.deleteFromInventory(index);
    }
    deleteFromInventory(index) {
        this.inventory.splice(index, 1);
        updateInventoryDisplay();
    }

    //Methods for updating stats when Masquerade changes.
    updateStats() {//for only updating one stat. For when upgrade shop is implemented.

    }
    masqueradeUpdateLives(deltaLives) { //Contains: stats update.
        //update display
        this.masquerade += deltaLives;
        document.getElementById("uiGrid__header__soloistDisplay").innerHTML = `Masquerade: ${this.masqueradeSymbols[this.masquerade]}`

        //update multipliers
        if(deltaLives == 1){ //if statement in prep for shop implements. deltaLives can = -1.
            game.attackMultiplier = game.attackMultiplier * 1.1;
            game.healthMultiplier = game.healthMultiplier * 0.9;
            game.parryCooldownMultipler = game.parryCooldownMultipler * 0.8;
            game.parryDurationMultiplier = game.parryDurationMultiplier * 0.8;
        }
        if(deltaLives == -1){ //can be bought with Wishes. Brings stats closer into balance.

        }

        console.log(`attackMultiplier: ${game.attackMultiplier} \n
parryCooldownMultipler: ${game.parryCooldownMultipler} \n
parryDurationMultiplier: ${game.parryDurationMultiplier}`)

        //update stats
        this.health = Math.round(this.baseHealth * game.healthMultiplier);
        for (var i = 0; i < this.attacks.length; i++) {
            if (this.attacks[i].type = "attack") {
                this.attacks[i].damage = Math.round(this.attacks[i].baseDamage * game.attackMultiplier);
            }
            if (this.attacks[i].type = "parry") {
                this.attacks[i].cooldown = Math.round(this.attacks[i].baseCooldown * game.parryCooldownMultipler);
                this.attacks[i].effectDuration = Math.round(this.attacks[i].baseEffectDuration * game.parryDurationMultiplier);
            }
        }

        //update health display
        if (this.masquerade < this.masqueradeSymbols.length) {
            document.getElementById("uiGrid__header__healthDisplay").innerHTML = `Health: ${this.health}`;
            this.statusLine = `Health: ${this.health}`;
        }
    }
}
class Enemy extends Entity {
    constructor(health, attackPower, attackCD, tier, enemyName, dialogue1, dialogue2) {
        super(health);
        this.atk = attackPower;
        this.atkCD = attackCD;
        this.x = 250;
        this.tier = tier;

        //Dialogue.
        this.name = enemyName;
        this.encounterDialogue = dialogue1;
        this.deathDialogue = dialogue2;
    }

    async attackTarget(target) {
        this.action = "attacking";
        await sleep(1000);
        if (target.action != "parrying" && this.health > 0) { //check just before attack lands. Stops enemy from attacking if killed during attack.
            target.takeDamage(this.atk);
            //Print output to dialogue.
            document.getElementById("encounterDialogue__output__outputBox").innerHTML = `Enemy hit you for ${this.atk}`;
        } else if (target.action == "parrying") {
            document.getElementById("encounterDialogue__output__outputBox").innerHTML = `Parried enemy attack for ${this.atk}`;
        }
        this.action = "";
    }
    takeDamage(damage) {
        this.health -= damage
        this.statusLine = `Health: ${this.health}`;
    }
}
//player attacks, and items.
class attack {
    constructor(name, damage, cooldown, stacks, type, effectDuration, effectChance) { //might need to add "name" attribute
        this.name = name;
        this.damage = damage;
        this.cooldown = cooldown;
        this.stacks = stacks;
        this.effectDuration = effectDuration;
        this.effectChance = effectChance;

        this.baseDamage = this.damage;
        this.baseCooldown = this.cooldown;
        this.baseEffectDuration = this.effectDuration;

        this.type = type;
    }
}
class item {
    constructor(name, description, usage, id) {
        this.name = name;
        this.description = description;
        this.usage = usage; //can be: "encounter" or "movement"
        this.id = id;
    }
}

//Cell class for the map array.
class Cell {
    constructor(name, type, symbol, tier, positionX, positionY, reVisitable, obscured) {
        this.name = name;     //name shown in encounter popup.
        this.type = type;     //wall, path, location, etc.
        this.tier = tier;     //difficulty of the room, used for generation
        this.symbol = symbol; //to display on map
        this.obscuredSymbol = "."; //symbol displayed when not viewed.
        this.x = positionX;
        this.y = positionY;

        //for display.
        this.obscured = obscured;

        this.cellID = `[${positionX}][${positionY}]`;

        //also stuff for second visits.
        this.alreadyVisited = false;
        this.reVisitable = reVisitable;
    }

    changeHiddenStatus(symbol) {
        this.hidden = false;
        this.symbol = symbol;
    }
}

//game class to keep track of all the game stuff!
class Game {
    constructor() {
        //Flags for attacking and moving.
        this.attacksLocked = true;
        this.movesLocked = false;
        this.inventoryOpen = false; //this will flag things.
        this.encounterLocked = false; //true on the move after an encounter, so no two in a row.

        this.firstEncounterDialogue = false;

        this.currentRoom = 1;
        this.moveCounter = 0;

        this.deathCounter = 0;
        this.encounterCounter = 0;
        
        this.movesSinceLastRandomEncounter = 3;

        //REMEMBER TO APPEND THE MOVES OF THE DIALOGUE MOVES HERE----------------------
        this.storyDialogueMoves = [8];
        this.storyDialogueEncounters = [2];
        //-----------------------------------------------------------------------------

        this.attackMultiplier = 1;
        this.healthMultiplier = 1;
        this.parryCooldownMultipler = 1;
        this.parryDurationMultiplier = 1;

        this.randomEncounterChance = 7;
    }
}

//Global variables-------------------------------------------------------------||
//------------------------Game stuff------------------------------------
//global game class.
var game = new Game();

//Get the output box paragraphs. These will be used for every iteration of output.
var mainOutputBoxIds = []; //array for <p> ids

//vars for the game.
var hpMulti = 1; //this will go down with deaths.
var atkMulti = 1; //this will go up with deaths.

var outputPause = 2000; //pause between text outputs.
//------------------------Player stuff------------------------------------
var player;
var enemy = new Enemy(null, null, null, null, null, null, null);
var globalHeight, globalWidth;
var playerX, playerY; //<- these are not in Player object. player.x is the canvas position for player.
var inventoryPosition = 0; //<- defines where the selector is in the inventory.
//---------------------------Map stuff------------------------------------
/* Area codes:
Codes: 
# - wall, unpassable.
; - passable terrain

♪ Tier: 1 Type: minor encounter
𝅘𝅥𝅯 Tier: 2 Type: major encounter
𝅘𝅥𝅰 Tier: 3 Type: boss encounter
𝄞 Tier: / Type: shop
*/
//vars for maps
const baseRoomClassNumbers = [5, 3, 1]; //class 1, class 2, class 3, respectively
var baseRoomTier = 1; //iterate this each room? Defines random encounter difficulties.
var roomClassMultiplier = [1, 1, 1]; //follows convention above.
const roomClassSymbols = ["♪", "𝅘𝅥𝅯", "𝅘𝅥𝅰", "𝄞"];
var pathSymbols = ["#", ";"];
var width = 30;
var height = 30;

//Global var map
var map;
var class1Rooms = []; //these lists have the coordinates of all locations.
var class2Rooms = [];
var class3Rooms = [];

//names for rooms!
const class1Names = ["A Derelict Pub", "A Modest Inn"];
const class2Names = ["A Grand Estate"];
const class3Names = ["The Dragon's Lair"];
//Util funcs----------------------------------------------------------------------||
//For player:
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function playerRandInt(min, max, type) {
    switch (type) {
        case "floor":
            return Math.floor(Math.random() * (max - min + 1)) + min;
        case "ceil":
            return Math.ceil(Math.random() * (max - min + 1)) + min;
        case "near":
            return Math.round(Math.random() * (max - min + 1)) + min;
    }
}
function flushCSS(element) { //flushes css to no transition.
    element.offsetHeight;
}
function procButtonCooldownTimer(buttonId, time) {
    let button = document.getElementById(`${buttonId}`);
    let timer = button.querySelector(".encounterDialogue__menu__button__progress");

    if (!game.attacksLocked && !button.disabled) {
        //Cooldown the button while animation takes place.
        button.disabled = true;
        setTimeout(function () { button.disabled = false; }, time * 1000);

        //Animation!
        timer.style.transition = "none"; //no animation.
        timer.style.width = "100%";
        flushCSS(timer);

        timer.style.transition = `width ${time}s linear` //animation again
        timer.style.width = "0%";
        flushCSS(timer);
    }
}

function updateInventoryDisplay() {
    var menu = document.getElementById("inventoryDisplay__menu");
    //remove the buttons already on the display first.
    while (menu.firstChild) {
        menu.removeChild(menu.lastChild);
    }

    //update the inventory and generate buttons.
    for (var i = 0; i < player.inventory.length; i++) {
        var button = document.createElement("button");
        if (i == 0) {
            button.innerHTML = `> ${player.inventory[i].name} <`;
            document.getElementById("inventoryDisplay__output").innerHTML = player.inventory[i].description;
        } else {
            button.innerHTML = player.inventory[i].name;
        }

        button.setAttribute("id", `${i}`);
        button.setAttribute("class", `inventoryDisplay__button`);

        menu.appendChild(button);
    }
}

//For map:
function randInt(max, type) {
    switch (type) {
        case "floor":
            return Math.floor(Math.random() * max);
        case "ceil":
            return Math.ceil(Math.random() * max);
        case "near":
            return Math.round(Math.random() * max);
    }
}
function calcPythagDistance(coordSetOne, coordSetCenter) {
    var differenceX = (coordSetOne[0] - coordSetCenter[0]);
    var differenceY = (coordSetOne[1] - coordSetCenter[1]);

    var distanceFromCenter = Math.sqrt((differenceX) ** 2 + (differenceY) ** 2);
    return distanceFromCenter;
}

//Sleep func:
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}