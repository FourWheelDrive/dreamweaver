class Cell {
    constructor(positionX, positionY, map, room, initialNode = null) {
        this.room = room;

        this.name = this.cellNameGenerator(this.constructor.name, this.room);//name shown in encounter popup.
        this.symbol = this.cellSymbolGenerator(this.constructor.name, this.room);
        this.initialNode = initialNode;         //initial dialogue node. This is the TAG.
        //The above could be an ARRAY. This could indicate a recurring encounter.

        this.hidden = true;

        this.mapX = positionX;
        this.mapY = positionY;

        this.cellID = `[${positionX}][${positionY}]`;   //HTML DOM ID
        this.domElement;
        this.mapHandler = map;
    }
    //Adds .domElement to this cell.
    addDomElement(){
        this.domElement = document.getElementById(this.cellID);
    }
    //func called by other cell types. Depending on caller and room, returns a name.
    cellNameGenerator(type, room) {
        var namesList;
        if(type == "WallCell"){
            return "";
        }
        if(type == "TowerCell"){
            return "A Tower Dormant";
        }
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
        if(type == "WallCell"){
            return "#";
        }
        if (type == "PathCell") {
            return ";";
        }
        if(type == "TowerCell"){
            return "♜";
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

    //Show/hide DOM element
    showCell(){
        this.domElement.innerHTML = this.symbol;
        this.hidden = false;
    }
    hideCell(){
        this.domElement.innerHTML = ".";
        this.hidden = true;
    }
}
class WallCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
}
class PathCell extends Cell {
    constructor(positionX, positionY) {
        super(positionX, positionY);
    }
}
class LocationCell extends Cell {
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
class TowerCell extends Cell {
    constructor(positionX, positionY, map) {
        super(positionX, positionY, map);
        this.active = false;
        this.visionRange = 4;
    }
    activateTower(){
        this.active = true;
        this.mapHandler.showCellsInVision(this.visionRange, this.mapX, this.mapY);
        this.name = "A Tower Astir";
    }
    showTowerVision(){
        if(this.active){
            this.mapHandler.showCellsInVision(this.visionRange, this.mapX, this.mapY);
        }
    }
}