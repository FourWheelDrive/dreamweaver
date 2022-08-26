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
class Entity{
    constructor(health, canvasSymbol) {
        this.health = health;

        this.action = "";                               //action: attacking, parrying
        this.statusLine = `Health: ${this.health}`;     //statusLine: health.

        this.atkOnCD = false;

        this.canvasSymbol = canvasSymbol;
        this.canvasY = 50;                              //Y position of entity element on canvas.
    }
}

//=====================================================Combat utility classes
class attack {
    constructor(name, damage, cooldown) {
        this.name = name;

        this.baseDamage = damage;                       //Masquerade multiplier applied to player baseDMG, baseCd. But only for player.
        this.baseCooldown = cooldown;
    }
}

//=====================================================GAME class
/*
Contents [class GAME]:

*/
class Game {
    constructor() {
        this.gameState = "title";
        /*
        game.gameState values:
        100 - title
        101 - end, ending
        102 - end, death

        0 - Turn begins, movement.
        1 - Move made. Determine next step.
        10 - Encounter on this turn. <<-- Dialogue happens (before or after?) encounter.
        11 - Dialogue on this turn.
        2 - End of turn. Final updates to flags and Masquerade. Could handle deaths.
        */

        this.currentRoom = 1;
        this.gameTime = 0;                                  //Serves as moveCounter.
        this.encounterCounter = 0;                          //tracks number of battles. Might be more useful if track moves since last battle?
        this.gameDialogueIntervals = ["1B"] //These are not actually times! These are turn intervals between dialogues. Can be movement or battle based.


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

var game = new Game();

//=====================================================CELL-based classes
/*
Contents [class CELL]:

IN CELL, MAKE A FUNCTION. DEPENDING ON CELL TYPE, IT PICKS ITS OWN NAME!!!!!!! Also could depend on room!
*/
class Cell{
    constructor(name, symbol, positionX, positionY) {
        this.name = name;                               //name shown in encounter popup.

        this.symbol = symbol;                           //actual symbol
        this.hiddenSymbol = ".";                        //symbol when out of vision and not viewed.
        this.hidden = true;

        this.mapX = positionX;                          //Map positions.
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID

        this.visited = false;                           //Boolean for display and revisits.
    }
    //func called by other cell types. Depending on caller and room, returns a name.
    cellNameGenerator(type, room){
        var namesList;
        switch(room){
            case 1:
                switch(type){ //each room will need this same switch.
                    case "path":
                        //make an array. get random number in arr.length. return element at index.
                        namesList = ["A Dusty Path", "A Desolate Avenue"] //Boulevard, street.
                        return namesList[randInt(namesList.length-1)];
                }
                break;
            case 2:
                break;
            case 3:
                break;
        }
    }
}
class PathCell{
    constructor(name, symbol, positionX, positionY) {
        super(name, symbol, positionX, positionY);
    }
    randomEncounterCheck(){

    }
    getName(){
        this.name = super.cellNameGenerator("path", game.room);
        console.log(this.name); //TAG: TEST OUTPUT
    }
}
class WallCell{
    constructor(name, symbol, positionX, positionY){
        super(name, symbol, positionX, positionY);
    }
    getName(){
        this.name = "A Wall";
    }
}

//==============================================================Global functions
function randInt(max) { //Random function, maximum inclusive.
    return Math.floor(Math.random() * (max+1));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}