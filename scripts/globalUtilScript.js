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
        if (target.status != "parrying") {
            target.health = target.health - difference;
            //depending on who got hit, change the health display.
            if (target instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = target.health;
            }
            if (target instanceof Enemy) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = target.health;
            }
            return false;
        } else {
            //if the player is parrying, return failed attack.
            return true;
        }
    }
    changeStatus(newStatus, caller, id = -1) {
        if (newStatus == "channelling" && caller instanceof Player) { //for channelled attacks, update the global channelled attack id.
            game.channelledID = id;
        }
        caller.status = newStatus;
        //depending on caller, update statusLine.
        if (caller instanceof Player) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__playerStatus").innerHTML = caller.status;
        }
        if (caller instanceof Enemy) {
            document.getElementById("gamePage__gameSpace__encounter__canvas__enemyStatus").innerHTML = caller.status;
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
        //NOTE: this should also be paired with a selection for which button to replace. Might come with inventory system.
        this.attacks.push(newAttack);
        //Update the button displays.
        switch (this.attacks.length) {
            case 1:
                document.getElementById("gamePage__gameSpace__encounter__menu__button1__text").textContent = `${newAttack.name}`;
                break;
            case 2:
                document.getElementById("gamePage__gameSpace__encounter__menu__button2__text").textContent = `${newAttack.name}`;
                break;
            case 3:
                document.getElementById("gamePage__gameSpace__encounter__menu__button3__text").textContent = `${newAttack.name}`;
                break;
            case 4:
                document.getElementById("gamePage__gameSpace__encounter__menu__button4__text").textContent = `${newAttack.name}`;
                break;
        }
    }
    getInitialPosition(mapWidth, mapHeight) {
        this.mapPosition = [(mapWidth - 1) / 2, (mapHeight - 1) / 2];
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack) {
        super(health, canvasSymbol);
        this.attack = attack;
        this.attackInterval;
    }

    //also initializes the encounter screen.
    async beginAttackSequence(cooldownHandler) {
        this.attackInterval = setInterval(async () => {
            if (game.gameState == "encounter") {
                this.attack.attackProcced(enemy, player, cooldownHandler);
            }
        }, this.attack.baseCooldown * 1000);
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
        this.baseEffectDuration = effectDuration;

        /*Attacks have four phases:
        Idle            - ready to be procced
        Channelling     - procced, delay before fire. Any other action cancels.
        Attacking       - Attack hits, do damage.
        Cooldown        - Cooldown begins after proc. Can't be procced in this time.
        */
        this.status = "idle"; //use in cooldown system.
    }
    //Call this when enemy or player procs attack.
    //NOTE: also update canvas output when called. "Enemy hit you for attack.damage!"
    async attackProcced(caller, target, cooldownHandler) {
        //NOTE: also needs to apply effects.
        //no need to check if on cooldown. button gets disabled with animation.

        //NOTE: there is probably a better way to apply effects. As it stands, I'm switch()ing.
        var tempAppliedStatus;
        var attackParried;
        //Step 0: await channelling.
        //Timeout with sleep().
        //NOTE: It's possible I could await a setTimeout here.
        if (this.baseChannelling != 0) {
            caller.changeStatus("channelling", caller, this.id);
            await sleep(this.baseChannelling * 1000);
        }
        //Step 1: Apply changes to game and Entities. After channelling, attack, and then (step 2) update display.
        switch (this.effect) {
            case "none": //standard damaging attack.
                //always check if the channeling has been interrupted.
                //if the player is channelling AND the channelled id is current attack.
                if ((caller.status == "channelling" && game.channelledID == this.id) || this.baseChannelling == 0) {
                    tempAppliedStatus = "attacking";
                    caller.changeStatus(tempAppliedStatus, caller); //check if the player is parrying or not.
                    attackParried = target.changeHealth(this.baseDamage, target);

                    //Step 2: update display.
                    if (caller instanceof Player) {
                        this.canvasOutput(`You hit the enemy for ${this.baseDamage} damage!`);
                    }
                    if (caller instanceof Enemy) {
                        if (!attackParried) {
                            this.canvasOutput(`The enemy hit you for ${this.baseDamage} damage!`);
                        } else if (attackParried) {
                            this.canvasOutput(`You parried the enemy attack.`);
                        }
                    }
                    //just for reaction's sake, show attack status.
                    await sleep(300);
                }
                break;
            case "parry":
                tempAppliedStatus = "parrying";
                caller.changeStatus(tempAppliedStatus, caller);
                await sleep(this.baseEffectDuration * 1000);
                break;
            case "heal":
                //always check if the channeling has been interrupted.
                if ((caller.status == "channelling" && game.channelledID == this.id) || this.baseChannelling == 0) {
                    tempAppliedStatus = "healing";
                    caller.changeStatus(tempAppliedStatus, caller);
                    target.changeHealth(this.baseDamage, caller); //health applied to self.

                    //Step 2: update display
                    if (caller instanceof Player) {
                        this.canvasOutput(`You recovered ${-1 * this.baseDamage} health.`);
                    }
                    if (caller instanceof Enemy) {
                        this.canvasOutput(`The enemy recovered ${-1 * this.baseDamage} health.`);
                    }
                }
                break;
        }
        //Step 3: Reset canvas.
        //after action, check if the move hasn't been interrupted and reset status.
        if (caller.status == tempAppliedStatus) {
            caller.changeStatus("", caller);
        }
    }
    canvasOutput(newMessage) {
        var outputs = [document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1"),
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2"),
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3")];

        for (var i = outputs.length - 1; i > -1; i--) {
            if (i > 0) {
                outputs[i].innerHTML = outputs[i - 1].innerHTML;
            }
            if (i == 0) {
                outputs[i].innerHTML = newMessage;
            }
        }
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
        this.channelledID;

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
    async encounterBegins() {
        //get a new enemy.
        //NOTE: changes depending on room, as well as cell.
        enemy = new Enemy(11, "!", new Attack("basic attack", 1, 2, 1));
        //initialize screen
        document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = player.health;
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = enemy.health;
        this.gameState = "encounter";

        //actually big brain this one, automatically switch to encounter screen.
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__encounter").style.display != "grid")

        await sleep(1000); //1 second grace.
        enemy.beginAttackSequence();
    }
    //reset things.
    //NOTE: needs to check whether player or enemy died to increase Masq or give rewards.
    encounterEnds() {
        clearInterval(enemy.attackInterval);
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = "";

        //TAG: TESTING 
        this.gameState = "movement";
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
class WallCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.name = "";
        this.symbol = "#";
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

class MinorEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
    initializeCell() {
        this.name = super.cellNameGenerator("minorLocation", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("minorLocation", game.currentRoom);
    }
    firstVisit() { //Start encounter.
        game.encounterBegins();
    }
}



//==========NOT CURRENTLY IN USE.==================COOLDOWN classes
//Contains array of cooldownData. Has a clock that decrements cooldowns each tick.
class CooldownHandler {
    constructor() {
        this.cooldowns = []; //an array of cooldownDatas.
        this.lastUpdate = Date.now();
        this.clockInterval;
    }
    initCooldowns() {//sets up clockInterval and calls processCooldowns each tick.
        var deltaTime;
        this.clockInterval = setInterval(() => { //<< TAG: EXTENSION: Why does arrow notation allow setInterval scope to work here?
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
    processCooldowns(deltaTime) { //Decrements cooldowns, and deletes them from cooldown list if needed.
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
async function sleep(ms) {
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