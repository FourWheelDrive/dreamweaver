/*
Contents [globalUtilityScript.js]:
1) Global classes.
1.1) Entity
1.1.1) Player
1.1.2) Enemy
1.2) Attack
1.3) Item

1.4) Cell
1.4.1) Path Cell
1.4.2) Wall Cell
1.4.3) Start Cell
1.4.4) Encounter Cell
1.4.5) Objective Cell

1.5) Game

2) Global Variables
3) Global Functions.
3.1) sleep(ms)
3.2) flushCSS(element)
3.3) buttonCooldownTimer(buttonID, time)
3.4) updateInvDisplay?????????
3.5) randInt

4) Cooldown Handler Classes
4.1) Cooldown Manager
4.2) Cooldown Data
*/

//=====================================================ENTITY-based classes
/*
Contents [class ENTITY]:
1) Health
2) Canvas display elements
2.1) symbol
2.2) y position
3) Attack
3.1) Cooldown boolean
3.2) Attack array
*/

class Entity {
    constructor(health, canvasSymbol) {
        this.health = health;
        this.canvasSymbol = canvasSymbol;

        /*Entity can have a few stances:
        Idle ""
        Channelling "Channelling"
        Attacking "Attacking"
        Parrying "Parrying" */
        this.status = "";
        /*Special Effects list, for now
        Heavy Armour?
        Stun 
        can only apply 1 buff/debuff to an entity at a time. Adding another replaces!*/
        this.buffEffect = "";
        this.debuffEffect = "";

        //Canvas stuff.
        this.actionLine = this.status;                  //action: attacking, parrying
        this.buffLine = this.buffEffect;
        this.debuffLine = this.debuffEffect;
    }

    changeHealth(difference, target) {
        this.health = this.health - difference;
        //depending on who got hit, change the health display.
        if (target instanceof Player) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = this.health;
        }
        if (target instanceof Enemy) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = this.health;
        }
    }
}

class Player extends Entity {
    constructor(health, canvasSymbol) {
        super(health, canvasSymbol);
        this.attacks = [];                              //Array of attack objects.
        this.inventory = [];                            //Array of item objects.
        this.masquerade = 0;
        this.wishes = 0;

        this.mapPosition = [];

        //set up header.
        document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}`;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
        document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;
    }
    addNewAttack(newAttack) {
        //NOTE: needs new case for 4+ attacks to go to replace.
        this.attacks.push(newAttack);
    }
    getInitialPosition(mapWidth, mapHeight) {
        this.mapPosition = [(mapWidth - 1) / 2, (mapHeight - 1) / 2];
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack) {
        super(health, canvasSymbol);
        this.attacks = attack;
    }
}

//=====================================================Combat utility classes
class Attack {
    constructor(name, damage, cooldown, channelling, effect = "none", effectDuration = "0") {
        this.name = name;
        this.id = game.nextAttackObjectID;              //identifies the object. Could be same type.
        game.nextAttackObjectID = game.nextAttackObjectID + 1;

        this.baseDamage = damage;                       //Masquerade multiplier applied to player baseDMG, baseCd. But only for player.
        this.baseCooldown = cooldown;
        this.baseChannelling = channelling;

        /*Currently only one effect exists.
        - None: none.
        - Stun: for a certain number of attacks, attack does not land.
        */
        this.effect = effect;
        this.effectDuration = effectDuration;

        /*Attacks have four phases:
        Idle            - ready to be procced
        Channelling     - procced, delay before fire. Any other action cancels.
        Attacking       - Attack hits, do damage.
        Cooldown        - Cooldown begins after proc. Can't be procced in this time.
        */
        this.status = "idle";
    }
    //Call this when enemy or player procs attack.
    //NOTE: also update canvas output when called. "Enemy hit you for attack.damage!"
    attackProcced(caller, target) {
        //NOTE: also needs to apply effects.
        //case 1: player's attack.
        if (caller instanceof Player) {

        }
        //case 2: enemy's attack.
        if (caller instanceof Enemy) {
            target.changeHealth(this.baseDamage, target);
        }
        this.goOnCooldown(caller); //cool down.
    }
    //After attack is procced, call cooldown.
    goOnCooldown(caller) {
        //NOTE: cooldown pseudocode.
        //Make a cooldownData object for this attack.
        //Append to cooldownHandler.
        //watch video for further instructions. (wait until cd done, undisable attack?)
        //      proposition: after cd done, remove this from cooldownHandler. 
        //      Check for attack in cdHandler to see if it can be procced or not.
    }
}

//=====================================================GAME class
/*
Contents [class GAME]:

*/
class Game {
    constructor() {
        this.gameState = "movement";
        /*
        game.gameState values:
        movement
        encounter
        inventory
        shop
        */

        this.currentRoom = 1;
        this.gameTime = 0;                                  //Serves as moveCounter.
        this.encounterCounter = 0;                          //tracks number of battles. Might be more useful if track moves since last battle?
        this.gameDialogueIntervals = ["1B"] //These are not actually times! These are turn intervals between dialogues. Can be movement or battle based.

        this.nextAttackObjectID = 1;                        //increments as attacks are created.

        //flags.
        this.attacksLocked = true;
        this.movesLocked = false;

        this.inventoryOpen = false;
        this.shopOpen = false;

        this.randomEncounterCooldown = 3;
        this.randomEncounterChance = 0.1;
        //-----------------------------------------------------------------------------
        //Multipliers for game progression.
        this.attackMultiplier = 1;                      //increases with mask
        this.healthMultiplier = 1;                      //decreases with mask
        this.parryCooldownMultipler = 1;                //increases with mask
        this.parryDurationMultiplier = 1;               //decreases with mask.

        //shop inventory.
        this.shopInventory = [];
    }
}

//=====================================================CELL-based classes
/*
Contents [class CELL]:

IN CELL, MAKE A FUNCTION. DEPENDING ON CELL TYPE, IT PICKS ITS OWN NAME!!!!!!!
*/
class Cell {
    constructor(positionX, positionY) {
        this.name;                             //name shown in encounter popup.
        this.symbol;

        this.mapX = positionX;                          //Map positions.
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID

        this.visited = false;                           //Boolean for display and revisits.
    }
    //func called by other cell types. Depending on caller and room, returns a name.
    cellNameGenerator(type, room) {
        var namesList;
        switch (room) {
            case 1:
                switch (type) { //each room will need this same switch.
                    case "path":
                        //make an array. get random number in arr.length. return element at index.
                        namesList = ["A Dusty Path", "A Desolate Avenue"] //Boulevard, street.
                        return namesList[randInt(namesList.length - 1)];
                    case "minorLocation":
                        namesList = ["A Test Name"];
                        return namesList[randInt(namesList.length - 1)];
                    case "testLocations":
                        namesList = ["A Cool Place", "A Grand Estate"];
                        return namesList[randInt(namesList.length - 1)];
                }
                break;
            case 2:
                break;
            case 3:
                break;
        }
    }
    //func called by other cell types. Returns symbols depending on caller and room.
    cellSymbolGenerator(type, room) {
        var symbolsList;
        if (type == "path") {
            return ";";
        }
        switch (room) {
            case 1:
                switch (type) {
                    case "minorLocation":
                        symbolsList = ["B", "F", "A"];
                        return symbolsList[randInt(symbolsList.length - 1)];
                }
                break;
            case 2:
                break;
        }
    }
}
class PathCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
    //NOTE: randomEncounters can be called from PathCell only!
    //NOTE: for encounter procs, initialize all of the encounter window too! (Health display, enemy.)
    randomEncounterCheck() {

    }
    initializeCell() {
        this.name = super.cellNameGenerator("path", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("path", game.currentRoom);
    }
}
class WallCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.name = "";
        this.symbol = "#";
    }
}
class MinorEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
    initializeCell() {
        this.name = super.cellNameGenerator("minorLocation", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("minorLocation", game.currentRoom);
    }
    firstVisit() { //Start encounter.

    }
}

//=====================================================COOLDOWN classes
//Contains array of cooldownData. Has a clock that decrements cooldowns each tick.
class CooldownHandler {
    constructor() {
        this.cooldowns = []; //an array of cooldownDatas.
        this.lastUpdate = Date.now();
        this.clockInterval;
    }
    initCooldowns() {//sets up clockInterval and calls processCooldowns each tick.
        var deltaTime;
        this.clockInterval = setInterval(() => {
            deltaTime = this.tick();
            this.processCooldowns(deltaTime);
        }, 0);
    }
    tick() {//Subtract last update from current time to find time since last tick.
        var currentTime = Date.now();
        var deltaTime = currentTime - this.lastUpdate;
        this.lastUpdate = currentTime;
        return deltaTime;
    }
    processCooldowns(deltaTime){ //Decrements cooldowns, and deletes them from cooldown list if needed.
        for (var i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i].decrementCooldown(deltaTime)) {//will be true if remainingtime == 0.
                this.cooldowns.splice(i, 1);
            }
        }
    }

    checkForId(id) { //check if attack is on cooldown (in array).
        for (var i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns.id == id) {
                return true;
            }
            return false;
        }
    }
    addCooldown(attack) {
        //NOTE: multiply baseCooldown by masquerade.
        this.cooldowns.push(new CooldownDate(attack.id, attack.baseCooldown));
    }
}
//Contains data about cooldown things. Decrements its own remainingTime.
class CooldownData {
    constructor(id, duration) {
        this.id = id;
        this.remainingTime = duration;
    }
    //returns whether or not the cooldown is 0.
    decrementCooldown(deltaTime) {
        this.remainingTime = Math.max(this.remainingTime - deltaTime, 0);
        return (this.remainingTime == 0);
    }
}

//==============================================================Global functions
function randInt(max) { //Random function, maximum inclusive.
    return Math.floor(Math.random() * (max + 1));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function calcPythagDistance(coordSetOne, coordSetCenter) {
    var differenceX = (coordSetOne[0] - coordSetCenter[0]);
    var differenceY = (coordSetOne[1] - coordSetCenter[1]);

    var distanceFromCenter = Math.sqrt((differenceX) ** 2 + (differenceY) ** 2);
    return distanceFromCenter;
}

//===============================================================Global Variables
var game = new Game();