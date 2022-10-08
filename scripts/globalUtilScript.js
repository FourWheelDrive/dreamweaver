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
        this.buff = null;
        this.debuff = null;

        //Canvas stuff.
        this.actionLine = this.status;                  //action: attacking, parrying
    }

    changeHealth(difference, target) {
        if (target.status != "parrying") {
            if(game.gameState == "encounter"){
                target.health = target.health - difference;
            } else {
                return;
            }

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
    //pass in a statusEffect object. Add.
    addStatusEffect(statusEffect, target) {
        switch (statusEffect.type) {
            case "buff":
                this.buff = statusEffect;
                if (target instanceof Player) {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                } else {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                }
                break;
            case "debuff":
                this.debuff = statusEffect;
                if (target instanceof Player) {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                } else {
                    document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `${statusEffect.effect}[${statusEffect.remainingDuration}]`;
                }
                break;
        }
    }
    clearStatusEffect(operation, target) {
        if (operation == "buff") {
            this.buff = null;
            if (target instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__pbuff").innerHTML = `+`;
            } else {
                document.getElementById("gamePage__gameSpace__encounter__canvas__ebuff").innerHTML = `+`;
            }
        }
        if (operation == "debuff") {
            this.debuff = null;
            if (target instanceof Player) {
                document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `-`;
            } else {
                document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `-`;
            }
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
        //clear cooldowns.
        cooldownHandler.clearCooldowns();
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
                        message1 = `Exercise caution. It is dark beyond.`
                        message2 = `ATK increased. <br> 
                        HP decreased.`
                        break;
                    case 5:
                        message1 = `One stares into the abyss.`
                        message2 = `The abyss stares back. <br>
                        <br>
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
                        try {
                            player.inventory[i].statusApplyMasqueradeMulti();
                        } catch (e) { }
                    }
                }
                //update health.
                this.maxHealth = this.healthMulti[this.masquerade];
                game.gameState = "encounter";       //Temporary flag update to let changeHealth through.
                this.changeHealth(-100, this);
                game.gameState = "masquerade";
                //update displays.
                document.getElementById("gamePage__footer__masquerade").innerHTML = `Masquerade: ${this.masquerade}`;
                //Update map => cell needs to be reset.
                mapArray[this.mapPosition[0]][this.mapPosition[1]].visitNumber = mapArray[this.mapPosition[0]][this.mapPosition[1]].visitNumber - 1;

                //return to game.
                clearPlayer(mapArray, true);
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
    constructor(name, damage, cooldown, channelling, description, effectObject = null) {
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
        this.effectObject = effectObject;

        //Effectual stats
        this.damage;
        this.cooldown;
        this.channelling;

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
    async attackProcced(caller, target) {
        //Step 0: await channelling.
        //Timeout with sleep().
        //NOTE: It's possible I could await a setTimeout here.
        if (this.baseChannelling != 0) {
            caller.changeStatus("channelling", caller, this.id);
            await sleep(this.baseChannelling * 1000);
        }

        //NOTE: there is probably a better way to apply effects. As it stands, I'm switch()ing.
        //==================Step 1: Apply status effects!
        //statusReturnCase 
        //==================Step 1.1: call .applyEffect on all buffs/debuffs to check what is happening.
        // array[0] is buff case, array[1] is debuff case.
        let callerStatusCase = [null, null];
        let targetStatusCase = [null, null];
        //---- caller status
        if (caller.buff != null) { callerStatusCase[0] = caller.buff.iterateDuration(); }
        if (caller.debuff != null) { callerStatusCase[1] = caller.debuff.iterateDuration(); }
        //---- target status
        if (target.buff != null) { targetStatusCase[0] = target.buff.iterateDuration(); }
        if (target.debuff != null) { targetStatusCase[1] = target.debuff.iterateDuration(); }

        //change necessary parameters here.
        //if caller is player:
        if (caller instanceof Player) {
            //player buffs/debuffs
            for (let i = 0; i < callerStatusCase.length; i++) {
                //Apply changes depending on each buff or debuff?
                if (callerStatusCase[i] != null) {
                    switch (callerStatusCase[i]) {
                        //Buffs_____________
                        //Debuffs_____________
                        case "stun":
                            game.canvasOutput("You are stunned!");
                            caller.changeStatus("", caller);
                            return;
                        case null:
                            break;
                    }
                }
            }
            //enemy buffs/debuffs
            for (let i = 0; i < targetStatusCase.length; i++) {
                if (targetStatusCase[i] != null) {
                    //Apply changes depending on each buff or debuff?
                    switch (targetStatusCase[i]) {
                        //Buffs_____________
                        //Debuffs_____________
                        case "stun":
                            break;
                        case null:
                            break;
                    }
                }
            }
        }
        //if caller is enemy:
        if (caller instanceof Enemy) {
            //enemy buffs/debuffs
            for (let i = 0; i < callerStatusCase.length; i++) {
                //Apply changes depending on each buff or debuff?
                if (callerStatusCase[i] != null) {
                    switch (callerStatusCase[i]) {
                        //Buffs_____________
                        //Debuffs_____________
                        case "stun":
                            game.canvasOutput("Enemy is stunned!");
                            caller.changeStatus("", caller);
                            return;
                        case null:
                            break;
                    }
                }
            }
            //player buffs/debuffs
            for (let i = 0; i < targetStatusCase.length; i++) {
                if (targetStatusCase[i] != null) {
                    //Apply changes depending on each buff or debuff?
                    switch (targetStatusCase[i]) {
                        //Buffs_____________
                        //Debuffs_____________
                        case "stun":
                            break;
                        case null:
                            break;
                    }
                }
            }
        }

        //==================Step 2: Apply changes to game and Entities. After channelling, attack
        //==================Step 3: Update display elements
        var attackParried;
        var tempAppliedStatus;
        if (this.effectObject == null) { //Standard attack, no effect.
            //standard damaging attack.
            //always check if the channeling has been interrupted.
            //  2 cases! one for player, one for enemy(check for parry)
            //Blanket check if encounter is still ongoing and if player is not in inventory.
            if (game.gameState == "encounter" && game.windowState == "fight") {
                //if the player is channelling AND the channelled id is current attack.
                if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                    tempAppliedStatus = "attacking";
                    caller.changeStatus(tempAppliedStatus, caller);
                    target.changeHealth(this.damage, target);
                    //Step 2: update display.
                    game.canvasOutput(`You hit the enemy for ${this.damage} damage!`);
                    //just for reaction's sake, show attack status.
                    await sleep(300);
                }

                if (caller instanceof Enemy) {
                    tempAppliedStatus = "attacking";
                    caller.changeStatus(tempAppliedStatus, caller);
                    attackParried = target.changeHealth(this.damage, target);//check if the player is parrying or not.
                    if (!attackParried) {
                        game.canvasOutput(`The enemy hit you for ${this.damage} damage!`);
                    } else if (attackParried) {
                        game.canvasOutput(`You parried the enemy attack.`);
                    }
                }
            }
        } else {
            switch (this.effectObject.effect) {
                //NOTE: Rework these two to use effectObjects.
                case "parry":
                    tempAppliedStatus = "parrying";
                    caller.changeStatus(tempAppliedStatus, caller);
                    await sleep(this.effectObject.duration * 1000);
                    break;
                case "heal":
                    //always check if the channeling has been interrupted.
                    if ((caller.status == "channelling" && game.channelledID == this.id) || this.baseChannelling == 0) {
                        tempAppliedStatus = "healing";
                        caller.changeStatus(tempAppliedStatus, caller);
                        target.changeHealth(this.damage, caller); //health applied to self.

                        //Step 2: update display
                        if (caller instanceof Player) {
                            if (caller.health >= caller.maxHealth) {
                                game.canvasOutput(`You are at max health!`);
                            } else {
                                game.canvasOutput(`You recovered ${-1 * this.damage} health.`);
                            }
                        }
                        if (caller instanceof Enemy) {
                            game.canvasOutput(`The enemy recovered ${-1 * this.damage} health.`);
                        }
                    }
                    break;

                //Special effect cases. These apply buff to self/debuff to enemy.
                //Buffs:
                //Debuffs:
                case "stun":
                    //if the player is channelling AND the channelled id is current attack.
                    //Blanket check if encounter is still ongoing and if player is not in inventory.
                    if (game.gameState == "encounter" && game.windowState == "fight") {
                        if ((caller instanceof Player && caller.status == "channelling" && game.channelledID == this.id) || (caller instanceof Player && this.baseChannelling == 0)) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus, caller);
                            target.addStatusEffect(new StatusEffect(this.effectObject.parent, this.effectObject.effect, this.effectObject.duration, this.effectObject.attackIterative), target);
                            game.canvasOutput(`Stunned the enemy!`);
                            await sleep(300);
                        }
                        if (caller instanceof Enemy) {
                            tempAppliedStatus = "casting";
                            caller.changeStatus(tempAppliedStatus, caller);

                            attackParried = target.changeHealth(this.damage, target);//check if the player is parrying or not.
                            if (!attackParried) {
                                target.addStatusEffect(new StatusEffect(this.effectObject.parent, this.effectObject.effect, this.effectObject.duration, this.effectObject.attackIterative), target);
                                game.canvasOutput(`Stunned!`);
                            } else if (attackParried) {
                                game.canvasOutput(`Avoided the stun.`);
                            }
                        }
                    }
                    break;
            }
        }
        //==================Step 4: Reset board.
        //after action, check if the move hasn't been interrupted and reset status.
        if (caller.status == tempAppliedStatus) {
            caller.changeStatus("", caller);
        }
        //Also reset stats that have been changed!
        this.applyMasqueradeMulti();
        if (this.effectObject != null) {
            this.effectObject.statusApplyMasqueradeMulti();
        }
    }
    //when masquerade gets updated, change stats.
    //Also call this on initialization for new attack objects!
    applyMasqueradeMulti() {
        //NOTE: masquerade may change other parameters depending on attack in the future. Cooldown, effectDur, channelling
        this.damage = Math.floor(this.baseDamage * player.damageMulti[player.masquerade]);
    }
}
class StatusEffect {
    constructor(parent, effect, duration = null, attackIterative = false, effectDescription = null) {
        this.parent = parent;
        this.target;
        if (this.parent instanceof Enemy) {
            this.target = player;
        } else {
            this.target = enemy;
        }
        this.duration = duration;
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
                    if (this.remainingDuration <= 0) { this.parent.clearStatusEffect(this.type, this.parent); }
                    break;
                case "debuff": //targets this.target
                    //update displays
                    if (this.target instanceof Player) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__pdebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    } else if (this.target instanceof Enemy) {
                        document.getElementById("gamePage__gameSpace__encounter__canvas__edebuff").innerHTML = `${this.effect}[${this.remainingDuration}]`;
                    }
                    if (this.remainingDuration <= 0) { this.target.clearStatusEffect(this.type, this.target); }
                    break;
            }
        }
        return this.effect; //for attackprocced.
    }
    //This also needs to apply masquerade! If duration changes.
    //NOTE: difference in durations happen here.
    statusApplyMasqueradeMulti() { }
}

class Item {
    /*
    requires
    this.equipped
    this.id, uses nextInventoryObjectId like attacks.
    */
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
        this.roomBossCellEntity;                            //the object of the cell for outside reference.
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
            let encounterLost = false;

            //Generate a new enemy.
            //NOTE: update with different cell types.
            enemy = entityDatabase.generateTier1Enemy(1);
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
                    this.gameState = "movement";
                    do {
                        document.getElementById("gamePage__header__left").click();
                    } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
                    //reset encounter screen.
                    document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
                    //clear cooldowns.
                    cooldownHandler.clearCooldowns();

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
        this.sequenceEnds(sequenceLength);
    }
    async sequenceEnds(sequenceLength) {
        //NOTE: wish calculation algs go here.
        let newWishes = sequenceLength;
        pushMainOutput(`You got ${newWishes} Wishes!`);
        //add money.
        player.addWishes(newWishes);
        await sleep(1500);

        //hide canvas.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "none";
        //auto switch back to the map.
        this.gameState = "movement";
        do {
            document.getElementById("gamePage__header__left").click();
        } while (document.getElementById("gamePage__gameSpace__map").style.display != "grid")
        //reset encounter screen.
        document.getElementById("gamePage__gameSpace__encounter__canvas").style.display = "grid";
        //clear cooldowns.
        cooldownHandler.clearCooldowns();
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
        this.gameState = "tempTransition";
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
            this.encounterPromiseReject(); //reject the sequence promise.
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
        document.getElementById("masquerade__lossScreen").style.display = "none";
        this.gameState = "masquerade";
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
*/
class Cell {
    constructor(positionX, positionY) {
        this.name;                             //name shown in encounter popup.
        this.symbol;

        this.mapX = positionX;                          //Map positions.
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID

        this.visitNumber = 0;
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
                        namesList = ["A Tattered Square"];
                        return namesList[randInt(namesList.length - 1)];
                    case "bossLocation":
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
        if (type == "path") {
            return ";";
        }
        switch (room) {
            case 1:
                switch (type) {
                    case "minorLocation":
                        symbolsList = ["B", "F", "A"];
                        return symbolsList[randInt(symbolsList.length - 1)];
                    case "bossLocation":
                        return "Ψ";
                }
                break;
            case 2:
                break;
        }
    }

    //Visits handler.
    visit() {
        //console.log(this.constructor.name) <-- this works and returns the child constructor name.
        if (this.visitNumber == 0 && this.firstVisit) {
            this.firstVisit();
        } else if (this.recurringVisit) { //Not all cells have recurring visit events.
            this.recurringVisit(this.visitNumber);
        }
        this.visitNumber = this.visitNumber + 1;
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
    initializeCell() {
        this.name = super.cellNameGenerator("path", game.currentRoom);
        this.symbol = super.cellSymbolGenerator("path", game.currentRoom);
    }
    //visits
    firstVisit() {
        this.randomEncounterCheck();
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
    //On first visit
    firstVisit() { //Start encounter.
        game.sequenceBegins(1);
    }
    //On subsequent visits
    recurringVisit(number) {
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
        this.symbol = "#"; //boss room replaces a wall.
        this.name = "";

        this.storedSymbol;
        this.storedName;
        this.revealed = false;
        //use game.currentRoom to define the room.
    }
    //Init 
    initializeCell() {
        this.storedName = super.cellNameGenerator("bossLocation", game.currentRoom);
        this.storedSymbol = super.cellSymbolGenerator("bossLocation", game.currentRoom);
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
        bossCellElement.style.fontSize = "25px";
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
        switch (game.currentRoom) {
            case 1:
                this.room1BossBegins();
                break;
            case 2:
                break;
        }
    }
    room1BossBegins() {
        enemy = entityDatabase.generateBossByName(1);
        game.sequenceBegins(5, "B1", true);
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
var cooldownHandler = new CooldownHandler();
var entityDatabase = new EntityDatabase();