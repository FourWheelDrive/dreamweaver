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
        this.masqueradeSymbols = ["⣀⣀⣀⣀⣀", "⣤⣄⣀⣀⣀", "⣦⣤⣄⣀⣀", "⣶⣶⣦⣤⣄", "⣶⣶⣶⣦⣤", "⣶⣶⣶⣶⣶"]; //length of this array is how many lives one has.

        this.parryOnCD = false;

        this.wishes = 0;
        document.getElementById("uiGrid__header__healthDisplay").innerHTML = `Health: ${this.health}`;
        document.getElementById("uiGrid__header__soloistDisplay").innerHTML = `Masquerade: ${this.masqueradeSymbols[this.masquerade]}`
    }
    addNewAttack(attack) {
        this.attacks.push(attack);
    }
    addWishes(newWishes) {
        this.wishes += newWishes;
        document.getElementById("uiGrid__header__wishesDisplay").innerHTML = `Wishes: ${this.wishes}`;
    }
    async attackTarget(target) {
        if (this.health > 0) { //stops from changing after death.
            this.action = "attacking";
            await sleep(1000);
            target.takeDamage(this.attacks[0].damage);
            if (this.health > 0) { //need to check again. Might have died during the await sleep.
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

    //Methods for updating stats when Masquerade changes.
    updateStats() {//for only updating one stat. For when upgrade shop is implemented.

    }
    masqueradeUpdateLives(deltaLives) { //Contains: stats update.
        //update display
        this.masquerade += deltaLives;
        document.getElementById("uiGrid__header__soloistDisplay").innerHTML = `Masquerade: ${this.masqueradeSymbols[this.masquerade]}`

        //update multipliers
        game.attackMultiplier += deltaLives / 10;
        game.healthMultiplier -= deltaLives / 10;
        game.parryCooldownMultipler -= deltaLives / 5;
        game.parryDurationMultiplier -= deltaLives / 3;

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

//Cell class for the map array.
class Cell{
    constructor(name, type, symbol, tier, positionX, positionY, reVisitable){
        this.name = name;     //name shown in encounter popup.
        this.type = type;     //wall, path, location, etc.
        this.tier = tier;     //difficulty of the room, used for generation
        this.symbol = symbol; //to display on map
        this.x = positionX;
        this.y = positionY;

        this.cellID = `[${positionX}][${positionY}]`;

        //also stuff for second visits.
        this.alreadyVisited = false;
        this.reVisitable = reVisitable;
    }
}

//game class to keep track of all the game stuff!
class Game {
    constructor(){
        this.encounterInProgress = false;
        this.fightInProgress = false;

        this.firstEncounterWon = false;
        this.firstEncounterDialogue = false;
        this.firstDeath = true;
        
        this.currentRoom = 1;
        this.moveCounter = 0;
        this.dialogueSequenceMoves = [1]; //check if moveCounter = these, then do the sequences.
        this.encounterSequenceMoves = [0, 1];
        this.encounterSequences = [];

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

    if (game.fightInProgress && !button.disabled) {
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