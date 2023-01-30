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
        //Canvas stuff.
        this.actionLine = this.status;                  //action: attacking, parrying

        this.canvasX;
    }

    //methods for:
    //health updates
    //action updates
}
class Player extends Entity {
    constructor(health) {
        super(health, "@");
        this.equipped = [null, null, null, null];        //four Encounter slots.

        this.inventory = [];           //Array of item objects.
        this.inventoryButtonData = []; //relates buttons to attacks.
        this.inventoryPointerPosition = 0;

        /*//Masquerade multipliers!
        this.masquerade = 0;
        //array index 0 for multipliers is base. Thus, masquerade = 0 is base.
        this.damageMulti = [1, 1, 1.5, 2, 2.5, 3] //math.floor and multiply base damage by these. Scales well for baseDMG 1-3.
        this.healthMulti = [10, 9, 8, 7, 6, 5];*/

        this.wishes = 10;
        this.mapPosition = [];

        //set up header.
        document.getElementById("gamePage__footer__health").innerHTML = `Health: ${this.health}`;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
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
    //Get Cell entity from position.
    getCurrentCellEntity(){
        return mapArray[this.mapPosition[0]][this.mapPosition[1]];
    }
    //Wishes.
    updateWishes(difference) {
        this.wishes = this.wishes + difference;
        document.getElementById("gamePage__footer__wishes").innerHTML = `Wishes: ${this.wishes}`;
    }
}

class Enemy extends Entity {
    constructor(health, canvasSymbol, attack, name, contactDialogue = [], defeatDialogue = []) {
        super(health, canvasSymbol);
        this.attack = attack;
        this.attackInterval;

        this.name = name;
        //for dialogues, pass in arrays! We'll cycle through the array in the output.
        this.contactDialogue = contactDialogue;
        this.defeatDialogue = defeatDialogue;
    }

    //also initializes the encounter screen.
    async beginAttackSequence(cooldownHandler) {
        //attack, then set timer.
        this.attack.attackProcced(enemy, player, cooldownHandler);

        //attack timer.
        this.attackInterval = setInterval(async () => {
            if (game.gameState == "encounter") {
                this.attack.attackProcced(enemy, player, cooldownHandler);
            }
        }, this.attack.baseCooldown * 1000);
    }
}

//=====================================================Combat utility classes
//Might need to add a tier system! Or maybe just keep it all the same? Player can build combos or change multipliers?
//OBJECTIVE NOTE: AttackItem needs a quantity attribute.
/*class Attack {
    constructor(name, damage, cooldown, channelling, description, effectObject = null) {
    }
}*/

//V2 ITEM CLASS
class Item {
    constructor(){
        //Dictionary of set values for items? Might make the constructor more legible. Just use a "key" param.
        //General Stats
        //Equipped Use Stats
        //Inventory Use Stats
    }
}
class StatusEffect {
    constructor(parent, effect, duration = null, attackIterative = false, magnitude = null, effectDescription = null) {
        this.parent = parent;
        this.target;
        if (this.parent instanceof Enemy) {
            this.target = player;
        } else {
            this.target = enemy;
        }
        this.duration = duration;
        this.magnitude = magnitude;
        this.attackIterative = attackIterative;
        this.remainingDuration = duration;

        this.effect = effect;
        this.effectDescription = effectDescription; //for display purposes.
        this.type;
        switch (this.effect) {
            //buffs
            //debuffs
            case "stun":
                this.type = "debuff";
                break;
            case "bleed":
                this.type = "debuff";
                break;
            case "barrier":
                this.type = "buff";
                break;
        }
        this.statusApplyMasqueradeMulti();
    }
    //when the affected entity makes an attack, iterate duration.
    iterateDuration() {
        if (this.attackIterative) {
            this.remainingDuration = this.remainingDuration - 1;
            switch (this.type) {
                case "buff": //targets this.parent
                    //update displays
                    if (this.parent instanceof Player) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    } else if (this.parent instanceof Enemy) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    }
                    if (this.remainingDuration <= 0) { this.parent.clearStatusEffect(this.type); }
                    break;
                case "debuff": //targets this.target
                    //update displays
                    if (this.target instanceof Player) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    } else if (this.target instanceof Enemy) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    }
                    if (this.remainingDuration <= 0) { this.target.clearStatusEffect(this.type); }
                    break;
            }
        }
        return;
    }
    //This also needs to apply masquerade! If duration changes.
    //NOTE: difference in durations happen here.
    statusApplyMasqueradeMulti() { }
}

//cooldown handler
class CooldownHandler {
    constructor() {
        this.attackUCooldown;
        this.attackICooldown;
        this.attackJCooldown;
        this.attackKCooldown;
    }
    clearCooldowns() {
        clearTimeout(this.attackUCooldown);
        clearTimeout(this.attackICooldown);
        clearTimeout(this.attackJCooldown);
        clearTimeout(this.attackKCooldown);
        document.getElementById("gamePage__gameSpace__encounter__menu__button1").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button2").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button3").disabled = false;
        document.getElementById("gamePage__gameSpace__encounter__menu__button4").disabled = false;
    }
}

//=====================================================WINDOWHANDLER class
//helps manage what windows are visible and when!
class WindowHandler {
    constructor() { }

    //auto switch to a page.
    clickToWindow(windowName) {
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById(`gamePage__gameSpace__${windowName}`).style.display != "grid")
    }
    //call after fights to clear canvas
    clearEncounterCanvas() {
        //reset canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyStatus").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = "";

        document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = "-";
        document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = "-";

        document.getElementById("gamePage__gameSpace__encounter__canvas__playerStatus").innerHTML = "";
    }
}
//=====================================================GAME class
/*
Contents [class GAME]:
*/
class Game {
    constructor() {
        //use these in conjunction with flags to judge which statements can and cannot fire.
        this.gameStates = ["movement", "dialogue", "encounter", "shop", "transition"];
        this.windowStates = ["map", "action", "shop", "transition"];
        this.gameState = this.gameStates[0];
        this.windowState = "map";

        this.currentRoom = 1;
        this.roomBossCellEntity;                            //the object of the cell for outside reference.
        this.roomBossHealth;                                //damage done to the boss stays there.

        this.gameTime = 0;                                  //Serves as moveCounter.
        this.encounterCounter = 0;                          //tracks number of battles. Might be more useful if track moves since last battle?
        this.gameDialogueIntervals = ["1B"] //These are not actually times! These are turn intervals between dialogues. Can be movement or battle based.

        this.nextInventoryObjectId = 1;                        //increments as attacks and items are created.
        this.channelledID;                                  //identifies currently channelled attack. Helps differentiate if a channel interrupts another.

        //flags.
        this.encounterPromiseResolve = function () { };
        this.encounterPromiseReject = function () { };
        //-----------------------------------------------------------------------------
        //Multipliers for game progression.
        this.attackMultiplier = 1;                      //increases with mask
        this.healthMultiplier = 1;                      //decreases with mask
        this.parryCooldownMultipler = 1;                //increases with mask
        this.parryDurationMultiplier = 1;               //decreases with mask.

        //shop inventory.
        this.shopInventory = [];
    }

    /* Old canvasOutput.
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
    }*/

    /* Old sequence functions. New sequence procs are coded within Cell classes.
    //Sequence functions: called per room.
    async sequenceBegins(sequenceLength, cellEntity, tier = 1, boss = null) {
        //actually big brain this one, automatically switch to encounter screen.
        this.gameState = this.gameStates[1]; //<-- this is actually just here to keep the screen's opacity 1.0.
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__encounter").style.display != "grid")

        //For sequence length, generate new enemies.
        // Also generates enemies (different cases for different cells). special case for bosses.
        for (var i = 0; i < sequenceLength; i++) {
            let encounterLost = false;
            //Generate a new enemy.
            //NOTE: Might move this to a cell function. Pass the cell entity into sequenceBegins()?
            if (boss) { //BOSS ROOM CASE
                if (i == sequenceLength - 1) {
                    enemy = boss;
                } else {
                    //replace with special enemies for each room's boss.
                    enemy = entityDatabase.generateTier1Enemy(1);
                }
            } else { //REGULAR CASE
                //replace with enemies for each cell type and room.
                enemy = entityDatabase.generateTier1Enemy(1);
            }
            //NOTE: generate new enemies here, instead of in encounterBegins(). Use entityDatabase methods.
            this.encounterBegins();
            let encounterPromise = await new Promise(function (resolve, reject) {
                game.encounterPromiseResolve = resolve;
                game.encounterPromiseReject = reject;
            }).then(
                result => {
                },
                error => {
                    //hide canvas. From sequenceEnds().
                    document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
                    //auto switch back to the map.
                    this.gameState = this.gameStates[0];
                    do {
                        document.getElementById("gamePage__header__left").click();
                    } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
                    //reset encounter screen.
                    document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
                    //clear cooldowns.
                    cooldownHandler.clearCooldowns();

                    //Update remaining boss health, if applicable.
                    if (boss) {
                        game.roomBossHealth = boss.health;
                    }

                    //catch things and end the loop.
                    encounterLost = true;
                }
            );
            //Break the for loop and exit sequence.
            if (encounterLost) {
                return;
            }
        }
        //when the enemies are all dead, end sequence.
        this.sequenceEnds(sequenceLength, cellEntity);
    }
    async sequenceEnds(sequenceLength, cellEntity) {
        //Call cellEntity's endVisit.
        await cellEntity.endVisit();
        //NOTE: wish calculation algs go here.
        let newWishes = Math.floor(sequenceLength / 2);
        if (newWishes < 1) { //get at least 1 wish.
            newWishes = 1;
        }
        pushMainOutput(`You got ${newWishes} Wishes!`);
        //add money.
        player.updateWishes(newWishes);
        await sleep(1500);

        //hide canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
        //auto switch back to the map.
        this.gameState = this.gameStates[0];
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
        //reset canvas
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
        //clear cooldowns.
        cooldownHandler.clearCooldowns();
    }
    */

    /*Old Encounter functions.
    //Encounter functions: called per fight.
    async encounterBegins() {
        //initialize screen
        document.getElementById("gamePage__gameSpace__encounter__canvas__playerShield").innerHTML = `${player.shield}/${player.maxShield}`;
        document.getElementById("gamePage__gameSpace__encounter__canvas__playerHealth").innerHTML = player.health;

        document.getElementById("gamePage__gameSpace__encounter__header__locationDisplay").innerHTML = enemy.name;

        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output1").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output2").innerHTML = "";
        document.getElementById("gamePage__gameSpace__encounter__canvas__outputBox__output3").innerHTML = "";

        //play the opening sequence. Freeze movement.
        this.gameState = this.gameStates[3];
        for (var i = 0; i < enemy.contactDialogue.length; i++) {
            await sleep(1000);
            pushMainOutput(enemy.contactDialogue[i]);
        }
        //enemy shows up!
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemy").innerHTML = enemy.canvasSymbol;
        document.getElementById("gamePage__gameSpace__encounter__canvas__enemyHealth").innerHTML = enemy.health;
        await sleep(1000);

        //Start the fight.
        this.gameState = this.gameStates[1];
        enemy.beginAttackSequence();
    }
    async encounterEnds() {
        this.gameState = this.gameStates[3];
        clearInterval(enemy.attackInterval);
        enemy.attackInterval = null;

        if (player.health <= 0) { //player loses, trigger masquerade.
            this.encounterPromiseReject(); //reject the sequence promise.
            windowHandler.clearEncounterCanvas(); //Reset the encounter scene.

            //if the player died on a boss, boss's health should be reduced.
            //  This is actually handled in the Promise error case.
            //Masquerade update.
            player.updateMasqueradeStats(1);
            return;
        }
        if (enemy.health <= 0) { //player wins! Give rewards, reward screen.
            //Display dialogue!
            for (var i = 0; i < enemy.defeatDialogue.length; i++) {
                pushMainOutput(enemy.defeatDialogue[i]);
                await sleep(1500);
            }
            await sleep(1500);
            this.encounterPromiseResolve();
            windowHandler.clearEncounterCanvas(); //Reset the encounter scene.
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
            })
        }
    }
    */

    //Start a new room.
    beginNewRoom() {
        //iterate room.
        this.currentRoom = this.currentRoom + 1;
        //remove children from map canvas.
        var map = document.getElementById("gamePage__gameSpace__map__canvas");
        while (map.firstChild) {
            map.firstChild.remove();
        }
        //generate a new map.
        var maxTunnels = 80, maxLength = 10;
        mapArray = generateNewRoom(mapWidth, mapHeight, maxTunnels, maxLength);

        //reset player
        clearPlayer(mapArray, true);
        player.getInitialPosition(mapWidth, mapHeight);

        //show vision
        showCellsInVision(5);
        showPlayer();
    }

    //game win or lose.
    winGame() {
        document.getElementById("masquerade__lossScreen").style.display = "none";
        this.gameState = this.gameStates[3];
        fadeElement("out", document.getElementById("gamePage"), 1);
        document.getElementById("game__win__screen").style.display = "flex";
        fadeElement("in", document.getElementById("game__win__screen"), 1);
    }
    loseGame() {
        document.getElementById("masquerade__lossScreen").style.display = "none";
        this.gameState = this.gameStates[3];
        fadeElement("out", document.getElementById("gamePage"), 1);
        document.getElementById("game__over__screen").style.display = "flex";
        fadeElement("in", document.getElementById("game__over__screen"), 1);
    }
}

//=====================================================CELL-based classes
/*
Contents [class CELL]:
All child classes of [CELL] require:
firstVisit()
recurringVisit() (not always) <== case 1 is the first recurrance, case 0 is firstVisit().
leaveVisit() <== for encounter cells after player wins.

initializeCell() moved to Cell.
*/
class Cell {
    constructor(positionX, positionY, initialNode = null) {
        this.name;                             //name shown in encounter popup.
        this.symbol;
        this.initialNode = initialNode;         //initial dialogue node. This is the TAG.
                            //The above could be an ARRAY. This could indicate a recurring encounter.

        this.mapX = positionX;                          //Map positions.
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID

        this.visitNumber = 0;
    }
    initializeCell() {
        if (this.constructor.name != "BossEncounterCell") {
            this.name = this.cellNameGenerator(this.constructor.name, game.currentRoom);
            this.symbol = this.cellSymbolGenerator(this.constructor.name, game.currentRoom);
        } else {// boss case.
            this.storedName = this.cellNameGenerator(this.constructor.name, game.currentRoom);
            this.storedSymbol = this.cellSymbolGenerator(this.constructor.name, game.currentRoom);
        }
    }
    //func called by other cell types. Depending on caller and room, returns a name.
    cellNameGenerator(type, room) {
        var namesList;
        switch (room) {
            case 1:
                switch (type) { //each room will need this same switch.
                    case "PathCell":
                        //make an array. get random number in arr.length. return element at index.
                        namesList = ["A Dusty Path", "A Desolate Avenue"] //Boulevard, street.
                        return namesList[randInt(namesList.length - 1)];
                    case "MinorEncounterCell":
                        namesList = ["A Tattered Square"];
                        return namesList[randInt(namesList.length - 1)];
                    case "SpecialEncounterCell":
                        //go by id.
                        switch (this.id) {
                            case "1-watchtower":
                                return "A Spectral Tower";
                        }
                        return;
                    case "BossEncounterCell":
                        return "The Dragon's Lair";
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
        if (type == "PathCell") {
            return ";";
        }
        switch (room) {
            case 1:
                switch (type) {
                    case "MinorEncounterCell":
                        symbolsList = ["B", "F", "A"];
                        return symbolsList[randInt(symbolsList.length - 1)];
                    case "SpecialEncounterCell":
                        return "S";
                    case "BossEncounterCell":
                        return "Ψ";
                }
                break;
            case 2:
                break;
        }
    }

    //Visits handler.
    //NOTE: also checks for event procs. Might need to interface with game flags?
    visit() {
        //console.log(this.constructor.name) <-- this works and returns the child constructor name.
        if (this.visitNumber == 0) {
            this.firstVisit();
        } else if (this.visitNumber > 0) { //Not all cells have recurring visit events.
            //this.recurringVisit(this.visitNumber);
        }
        this.visitNumber = this.visitNumber + 1;
    }
    endVisit(){
        game.gameState = game.gameStates[0];
        //Might need to reset the map.
        document.getElementById("gamePage__gameSpace__map").style.opacity = "1.0";
    }
    iterateVisits() {
        this.visitNumber = this.visitNumber + 1;
    }
}
class WallCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.name = "";
        this.symbol = "#";
    }
}
//random encounters not done yet.
class PathCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.randomEncounterChance = 0.005;
    }
    //NOTE: randomEncounters can be called from PathCell only!
    randomEncounterCheck() {

    }
    //visits
    firstVisit() {
        this.randomEncounterCheck();
    }
}

class MinorEncounterCell extends Cell {
    constructor(positionX, positionY, initialNode) {
        super(positionX, positionY, initialNode);
    }
    //On first visit
    firstVisit() { //Start encounter.
        //Change gameState.
        game.gameState = game.gameStates[1];
        //switch screens.
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__actionWindow").style.display != "grid")
        //Start dialogue encounter.
        dialogueDictionary[this.initialNode].nodeEntered();
    }
}

/*//Story cells. Visiting one of these pushes the story.
class SpecialEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);

        //pick id internally!!
        this.id = "1-watchtower";
    }
    firstVisit() {
        //CONVENTION: "roomNumber-roomName"
        switch (this.id) {
            case "1-watchtower":
                this.endVisit();
                break;
        }
    }
    recurringVisit(number) {

    }
    async endVisit() {
        let outputArray;
        game.gameState = game.gameStates[3];
        switch (this.id) {
            case "1-watchtower":
                outputArray = [
                    "A tower looms over the city.",
                    "The ground shudders.",
                    "Disturbances in the distance."];
                for (var i = 0; i < outputArray.length; i++) {
                    pushMainOutput(outputArray[i]);
                    await sleep(1500);
                }
                game.roomBossCellEntity.revealBossCell();
                break;
        }
        game.gameState = game.gameStates[0];
    }
}
//End of room cells. Sequence enemies, then boss fights.
class BossEncounterCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
        this.symbol = "#"; //boss room replaces a wall.

        this.storedSymbol;
        this.storedName;
        this.revealed = false;
        //use game.currentRoom to define the room.
    }
    //room revealed
    revealBossCell() {
        //update cell!
        this.revealed = true;
        this.symbol = this.storedSymbol;
        this.name = this.storedName;

        var bossCellElement = document.getElementById(`[${this.mapX}][${this.mapY}]`);
        bossCellElement.innerHTML = this.symbol;
        bossCellElement.style.fontWeight = "700";
        bossCellElement.style.fontStretch = "expanded";
        bossCellElement.style.fontSize = "22px";
        showCellsInVision(5);
        showPlayer();
    }

    //visits
    firstVisit() {
        if (!this.revealed) { //if the boss cell hasn't been revealed yet, pretend it hasn't been visited.
            this.visitNumber = 0;
            return;
        }
        //Depending on which room it is, spawn a different boss.
        let tempEnemy;
        tempEnemy = entityDatabase.generateBossByName(game.currentRoom);
        game.sequenceBegins(3, this, `B${game.currentRoom}`, tempEnemy);
        game.roomBossHealth = tempEnemy.health;
    }
    recurringVisit(number) {
        let tempEnemy;
        tempEnemy = entityDatabase.generateBossByName(game.currentRoom);
        tempEnemy.health = game.roomBossHealth;
        //New dialogues for returns.
        //NOTE: could switch again with visitNumber for even more customized dialogues!
        switch (game.currentRoom) {
            case 1:
                tempEnemy.contactDialogue = [
                    `The beast growls.`,
                    `The fight wears on it, but not you.`
                ]
                break;
            case 2:
                tempEnemy.contactDialogue = [
                    ``,
                    ``
                ]
                break;
        }
        game.sequenceBegins(3, this, `B${game.currentRoom}`, tempEnemy);
    }
    //NOTE: Change this for additional rooms.
    async endVisit() {
        //NOTE: For TESTING purposes! Later, check if this is the last room to clear.
        game.winGame();
        return;

        //we co-opt Masquerade screen for this lol
        let newWishes = 5;
        player.updateWishes(newWishes);
        fadeElement("out", document.getElementById("gamePage"), 1);

        let masqueradeWindow = document.getElementById("masquerade__lossScreen");
        let maskOutput1 = document.getElementById("masquerade__lossScreen__output1");
        let maskOutput2 = document.getElementById("masquerade__lossScreen__output2");
        switch (game.currentRoom) { //dialogues for each room.
            case 1:
                maskOutput1.innerHTML = "The beast lies still.";
                maskOutput2.innerHTML = "The boulevard stretches into the mist.";
                break;
        }

        masqueradeWindow.style.display = "flex";
        fadeElement("in", masqueradeWindow, 1);
        //Generate a new room and reset player.
        game.beginNewRoom();
        //Automatically return to map screen.

        //Disable transition screen.
        await sleep(5000);
        //hide canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
        //auto switch back to the map.
        game.gameState = "movement";
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
        //reset canvas
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
        //fade back in.
        fadeElement("out", masqueradeWindow, 1);
        fadeElement("in", document.getElementById("gamePage"), 1);
    }
}*/

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
async function fadeElement(operation, element, time){
    if(operation == "in"){
        element.style.opacity = "0.0";
        element.style.transition = `opacity ${time}s`;
        flushCSS(element);
        element.style.opacity = "1.0";
    }
    if(operation == "out"){
        element.style.opacity = "1.0";
        element.style.transition = `opacity ${time}s`;
        flushCSS(element);
        element.style.opacity = "0.0";
    }
    await sleep(time*1000);
    //return the transition to normal.
    element.style.transition = `opacity 0s`;
    flushCSS(element);
}


//===============================================================Global Variables
var game = new Game();
var windowHandler = new WindowHandler();
var cooldownHandler = new CooldownHandler();
var entityDatabase = new EntityDatabase();