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
            this.name = this.cellNameGenerator(this.constructor.name, gameManager.currentRoom);
            this.symbol = this.cellSymbolGenerator(this.constructor.name, gameManager.currentRoom);
        } else {// boss case.
            this.storedName = this.cellNameGenerator(this.constructor.name, gameManager.currentRoom);
            this.storedSymbol = this.cellSymbolGenerator(this.constructor.name, gameManager.currentRoom);
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
    endVisit() {
        gameManager.gameState = gameManager.gameStates[0];
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
        gameManager.gameState = gameManager.gameStates[1];
        //switch screens.
        windowHandler.clickToWindow("actionWindow");
        //Start dialogue encounter.
        dialogueDictionary[this.initialNode].nodeEntered();
    }
}




//===============================================================Global Variables