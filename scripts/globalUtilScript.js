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

            //TAG: FLAG CHECK
            //Check if encounter ends. If target health <= 0.
            if (target.health <= 0) {
                game.encounterEnds();
                return;
            }
            //Check if healed past maxHealth.
            if (target instanceof Player && target.health > target.maxHealth) {
                target.health = target.maxHealth;
            }

            //depending on who got hit, change the health display.
            if (target instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = target.health;
                document.getElementById("gamePage__footer__health").innerHTML = `Health: ${target.health}/${target.maxHealth}`;
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
    constructor(maxHealth, canvasSymbol) {
        super(maxHealth, canvasSymbol);
        this.maxHealth = maxHealth;                     //health and maxHealth are set to the same, initially.
        this.attacks = [null, null, null, null];        //Array of attack objects.

        this.inventory = [];          //Array of item objects.
        this.inventoryButtonData = []; //relates buttons to attacks.
        this.inventoryPointerPosition = 0;

        //Masquerade multipliers!
        this.masquerade = 0;
        //array index 0 for multipliers is base. Thus, masquerade = 0 is base.
        this.damageMulti = [1, 1, 1.5, 2, 2.5, 3] //math.floor and multiply base damage by these. Scales well for baseDMG 1-3.
        this.healthMulti = [10, 9, 8, 7, 6, 5];

        this.wishes = 0;

        this.mapPosition = [];

        //set up header.
        document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}/${this.maxHealth}`;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
        document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;
    }
    //Inventory methods
    addToInventory(newObject) {
        this.inventory.push(newObject);
    }
    //Loadout switch from inventory
    addNewAttack(newAttack, position) {
        //NOTE: needs new case for 4+ attacks to go to replace.
        //NOTE: this should also be paired with a selection for which button to replace. Might come with inventory system.

        //NOTE: IF THE ATTACK IS ALREADY EQUIPPED, CHANGE LAST POSITION (this.attacks) TO NULL.
        //if the attack is equipped, remove it.
        if (newAttack.equipped) {
            for (var i = 0; i < player.attacks.length; i++) {
                try {
                    if (player.attacks[i].id == newAttack.id) {
                        player.attacks[i] = null;
                    }
                } catch (e) { }
            }
        }
        //unequip last attack.
        let previousAttack = this.attacks[position];
        if (previousAttack != null) {
            previousAttack.equipped = false;
        }
        this.attacks[position] = newAttack;
        newAttack.equipped = true;

        //Update the button displays-- both for encounters and for inventory!
        for (var i = 0; i < this.attacks.length; i++) {
            if (this.attacks[i] == null) {
                document.getElementById(`gamePage__gameSpace__encounter__menu__button${i + 1}__text`).textContent = "";
                document.getElementById(`gamePage__gameSpace__inventory__equipMenu__button${i + 1}`).innerHTML = "";
            } else {
                document.getElementById(`gamePage__gameSpace__encounter__menu__button${i + 1}__text`).textContent = `${this.attacks[i].name}`;
                document.getElementById(`gamePage__gameSpace__inventory__equipMenu__button${i + 1}`).innerHTML = `${this.attacks[i].name}`;
            }
        }
        //update inventory display.
        initializeInventoryWindow();
    }
    getInventoryCounterpartIndex(id) {
        for (var i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].id == id) {
                return i;
            }
        }
    }
    //Map methods
    getInitialPosition(mapWidth, mapHeight) {
        this.mapPosition = [(mapWidth - 1) / 2, (mapHeight - 1) / 2];
    }
    //Wishes.
    addWishes(difference) {
        this.wishes = this.wishes + difference;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
    //Methods for masquerade.
    //Updates stats, but ALSO CALLS ANIMATION.
    async updateMasqueradeStats(operation) { //operation is -1 or 1. -1 is heal, 1 is death.
        switch (operation) {
            case -1:
                //healing has different dialogues. only appears on some masks.
                break;
            case 1:
                //update screen and play defeat animation
                game.gameState = "masquerade"
                fadeElement("out", document.getElementById("gamePage"), 1);

                this.masquerade = this.masquerade + 1;
                //check if the player has actually lost.
                let message1;
                let message2;
                switch (this.masquerade) {
                    case 1:
                        message1 = `Defeat stings.`
                        message2 = `HP decreased.`
                        break;
                    case 2:
                        message1 = `Adversity is a harsh mentor.`
                        message2 = `ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 3:
                        message1 = `i forgor what to put here`
                        message2 = `ATK increased. <br> 
                    HP decreased.`
                        break;
                    case 4:
                        message1 = `Urge caution. It is dark beyond.`
                        message2 = `ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 5:
                        message1 = `One stares into the abyss.`
                        message2 = `The abyss stares back. <br>
                        ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 6: //loss case
                        return game.loseGame();
                }

                let masqueradeWindow = document.getElementById("masquerade__lossScreen");
                let maskOutput1 = document.getElementById("masquerade__lossScreen__output1");
                let maskOutput2 = document.getElementById("masquerade__lossScreen__output2");
                maskOutput1.innerHTML = message1;
                maskOutput2.innerHTML = message2;
                masqueradeWindow.style.display = "flex";
                fadeElement("in", masqueradeWindow, 1);
                await sleep(5000);

                //update attack parameters.
                for (var i = 0; i < player.inventory.length; i++) {
                    if (player.inventory[i] instanceof Attack) {
                        player.inventory[i].applyMasqueradeMulti();
                    }
                }
                //update health.
                this.maxHealth = this.healthMulti[this.masquerade];
                this.changeHealth(-100, this);
                //update displays.
                document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;

                //return to game.
                clearPlayer(mapArray);
                this.getInitialPosition(mapWidth, mapHeight); //reset player position
                showPlayer();
                fadeElement("out", masqueradeWindow, 1);
                fadeElement("in", document.getElementById("gamePage"), 1);
                game.gameState = "movement";
                break;
        }
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack, contactDialogue = [], defeatDialogue = []) {
        super(health, canvasSymbol);
        this.attack = attack;
        this.attackInterval;

        //for dialogues, pass in arrays! We'll cycle through the array in the output.
        this.contactDialogue = contactDialogue;
        this.defeatDialogue = defeatDialogue;
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
//Might need to add a tier system! Or maybe just keep it all the same? Player can build combos or change multipliers?
class Attack {
    constructor(name, damage, cooldown, channelling, description, effect = "none", effectDuration = "0") {
        //data stats
        this.name = name;
        this.id = game.nextInventoryObjectId;              //identifies the object. Could differentiate between the same type.
        game.nextInventoryObjectId = game.nextInventoryObjectId + 1;
        this.equipped = false;                          //identifies whether or not, from inventory, attack is equipped.
        this.description = description;
        //combat stats
        this.baseDamage = damage;                       //Masquerade multiplier applied to player baseDMG, baseCd. But only for player.
        this.baseCooldown = cooldown;
        this.baseChannelling = channelling;
        /*Effects
        - none: none.
        - parry: Deflect enemy attacks for effectDuration.
        - heal: apply negative damage to yourself.

        - stun: for a certain number of attacks, attack does not land.
        */
        this.effect = effect;
        this.baseEffectDuration = effectDuration;

        //Effectual stats
        this.damage;
        this.cooldown;
        this.channelling;
        this.effectDuration;

        /*Attacks have four phases:
        Idle            - ready to be procced
        Channelling     - procced, delay before fire. Any other action cancels.
        Attacking       - Attack hits, do damage.
        Cooldown        - Cooldown begins after proc. Can't be procced in this time.
        */
        this.status = "idle"; //use in cooldown system.

        //apply modifiers.
        this.applyMasqueradeMulti();
    }
    //Call this when enemy or player procs attack.
    //NOTE: also update canvas output when called. "Enemy hit you for attack.damage!"
    async attackProcced(caller, target) {
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

        //Step 1: Apply changes to game and Entities. After channelling, attack
        //Step 2: Update display elements
        switch (this.effect) {
            case "none": //standard damaging attack.
                //always check if the channeling has been interrupted.

                //if the player is channelling AND the channelled id is current attack.
                //Blanket check if encounter is still ongoing and if player is not in inventory.
                if (game.gameState == "encounter" && game.windowState == "fight") {
                    if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                        tempAppliedStatus = "attacking";
                        caller.changeStatus(tempAppliedStatus, caller);
                        target.changeHealth(this.baseDamage, target);
                        //Step 2: update display.
                        game.canvasOutput(`You hit the enemy for ${this.baseDamage} damage!`);
                        //just for reaction's sake, show attack status.
                        await sleep(300);
                    }

                    if (caller instanceof Enemy) {
                        tempAppliedStatus = "attacking";
                        caller.changeStatus(tempAppliedStatus, caller);
                        attackParried = target.changeHealth(this.baseDamage, target);//check if the player is parrying or not.
                        if (!attackParried) {
                            game.canvasOutput(`The enemy hit you for ${this.baseDamage} damage!`);
                        } else if (attackParried) {
                            game.canvasOutput(`You parried the enemy attack.`);
                        }
                    }
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
                        if (caller.health >= caller.maxHealth) {
                            game.canvasOutput(`You are at max health!`);
                        } else {
                            game.canvasOutput(`You recovered ${-1 * this.baseDamage} health.`);
                        }
                    }
                    if (caller instanceof Enemy) {
                        game.canvasOutput(`The enemy recovered ${-1 * this.baseDamage} health.`);
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
    //when masquerade gets updated, change stats.
    //Also call this on initialization for new attack objects!
    applyMasqueradeMulti() {
        //NOTE: masquerade may change other parameters depending on attack in the future. Cooldown, effectDur, channelling
        this.damage = Math.floor(this.baseDamage * player.damageMulti[player.masquerade]);
    }
}
class Item {
    /*
    requires
    this.equipped
    this.id, uses nextInventoryObjectId like attacks.
    */
}

//=====================================================GAME class
/*
Contents [class GAME]:
*/
//var encounterPromiseResolve;
//var encounterPromiseReject;
class Game {
    constructor() {
        this.gameState = "movement";
        this.windowState = "map";
        /*
        CHANGES TO GAME.GAMESTATE.
        game.gameState tracks what the game is doing right now.
        - movement
        - encounter => tempTransition (for dialogues, but disables attacks)
        - shop
        - masquerade => disables everything. Defeat dialogue.

        window.windowState tracks which screen the player is on.
        - map
        - fight
        - result (win fight, no attacks can be procced)
        - death (not yet made, on player death.)
        - inventory
        - shop

        Use these in conjunction to flag which events are and aren't allowed to fire.
        */

        this.currentRoom = 1;
        this.gameTime = 0;                                  //Serves as moveCounter.
        this.encounterCounter = 0;                          //tracks number of battles. Might be more useful if track moves since last battle?
        this.gameDialogueIntervals = ["1B"] //These are not actually times! These are turn intervals between dialogues. Can be movement or battle based.

        this.nextInventoryObjectId = 1;                        //increments as attacks and items are created.
        this.channelledID;

        //flags.
        this.encounterPromiseResolve = function () { };
        this.encounterPromiseReject = function () { };
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

    //Sequence functions: called per room.
    //Encounter functions: called per individual fight.
    async sequenceBegins(sequenceLength, tier = 1, boss = false) {
        //actually big brain this one, automatically switch to encounter screen.
        this.gameState = "encounter"; //<-- this is actually just here to keep the screen's opacity 1.0.
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__encounter").style.display != "grid")

        //For sequence length, generate new enemies.
        // Also generates enemies (different cases for different cells). special case for bosses.
        for (var i = 0; i < sequenceLength; i++) {
            //Generate a new enemy.
            //NOTE: update with different cell types.
            enemy = entityDatabase.generateTier1Enemy(1);
            //NOTE: generate new enemies here, instead of in encounterBegins(). Use entityDatabase methods.
            this.encounterBegins();
            let encounterPromise = await new Promise(function (resolve, reject) {
                game.encounterPromiseResolve = resolve;
                game.encounterPromiseReject = reject;
            }).then(
                function (error) {
                    return;
                }
            );
        }

        //when the enemies are all dead, end sequence.
        this.sequenceEnds();
    }
    async sequenceEnds() {
        //hide canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";

        //auto switch back to the map.
        this.gameState = "movement";
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__map").style.display != "flex")

        //reset encounter screen.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
    }
    async encounterBegins() {
        //initialize screen
        document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = player.health;

        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        //play the opening sequence. Freeze movement.
        this.gameState = "tempTransition";
        for (var i = 0; i < enemy.contactDialogue.length; i++) {
            await sleep(1000);
            pushMainOutput(enemy.contactDialogue[i]);
        }
        //enemy shows up!
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = enemy.canvasSymbol;
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = enemy.health;
        await sleep(1000);

        //Start the fight.
        this.gameState = "encounter";
        enemy.beginAttackSequence();
    }
    async encounterEnds() {
        clearInterval(enemy.attackInterval);
        enemy.attackInterval = null;

        //reset canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyStatus").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__playerStatus").innerHTML = "";

        if (player.health <= 0) { //player loses, trigger masquerade.
            player.updateMasqueradeStats(1);
            this.encounterPromiseReject(); //reject the sequence promise.
            return;
        }
        if (enemy.health <= 0) { //player wins! Give rewards, reward screen.
            //NOTE: wish calculation algs go here.
            let newWishes = 1;
            //Display dialogue!
            for (var i = 0; i < enemy.defeatDialogue.length; i++) {
                pushMainOutput(enemy.defeatDialogue[i]);
                await sleep(1500);
            }
            pushMainOutput(`You got ${newWishes} Wishes!`);
            //add money.
            player.addWishes(newWishes);
            await sleep(1500);

            this.encounterPromiseResolve();

            //OLD RESULTS SCREEN
            /*
            document.getElementById("gamePage__gameSpace__encounter__result").style.display = "flex";
            //Wait until player clicks button to go back.
            await new Promise(resolve => {
                document.getElementById("gamePage__gameSpace__encounter__result__returnButton").addEventListener("click", (e) => {
                    resolve();
                }, { once: true }); //once: true removes the listener after clicked once.
                //any key press will remove both eventlisteners.
                document.addEventListener("keydown", (e) => {
                    document.getElementById("gamePage__gameSpace__encounter__result__returnButton").click();
                }, { once: true }); //once: true removes the listener after clicked once.
            })*/
        }
    }

    //game win or lose.
    winGame() { }
    loseGame() {
        this.gameState = "masquerade";
        fadeElement("out", document.getElementById("gamePage"), 1);
        document.getElementById("game__over__screen").style.display = "flex";
        fadeElement("in", document.getElementById("game__over__screen"), 1);
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

//plentiful encounters. Single encounters?
class MinorEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
    initializeCell() {
        this.name = super.cellNameGenerator("minorLocation", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("minorLocation", game.currentRoom);
    }
    firstVisit() { //Start encounter.
        if (this.visited == false) {
            game.sequenceBegins(1);
            this.visited = true;
        }
    }
}
//slightly less plentiful. Chain encounters, could reward with more wishes or items!
class SequenceEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);

        this.sequenceLength = randInt(2) + 1;
    }
    async firstVisit() {

    }
}
//Story cells. Specific characters appear here, depending on ID.
class SpecialEncounterCell extends Cell {
    constructor() {

    }
    firstVisit() {

    }
}
//End of room cells. Sequence enemies, then boss fights.
class BossEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        //use game.currentRoom to define the room.
    }
    firstVisit() {
        switch (game.currentRoom) {
            case 1:
                this.room1BossBegins();
                break;
            case 2:
                break;
        }
    }
    room1BossBegins() {
        if (this.visited == false) {
            
                this.visited = true;
        }
    }
    room2BossBegins() {

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
//Fades elements in.
async function fadeElement(operation, element, time) { //fade elements in/out
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
                    let ticks = (time * 1000) / 10;
                    newOpacity += 1 / ticks;
                }
            }, 10)
            await sleep(time * 1000);
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
                    let ticks = (time * 1000) / 10;
                    newOpacity -= 1 / ticks;
                }
            }, 10)
            await sleep(time * 1000);
            break;
    }
}

//===============================================================Global Variables
var game = new Game();
var entityDatabase = new EntityDatabase();


//==========NOT CURRENTLY IN USE.=========================================================================COOLDOWN classes
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
