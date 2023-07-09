class Card{
    constructor(id, owner){
        this.name;
        this.type; //P or A
        this.description;
        this.owner = owner; //Player or enemy. Enemy might need an identifyer now, since they're on board?

        this.magnitude;
        this.target; //Opposition or self.
        this.effect; //buffs/debuffs.
        this.passive;

        //call an initialize function to make the card without making super duper long constructor.
        initializeCard(id);
    }

    //SUPER MEGA NOTE: ADD HOVER LISTENER and a DISPLAY somewhere to show full cards and effect explanations when hovered.
    //Condensed symbols shown normally.

    //switch id to set this attributes.
    initializeCard(id){
        var attributeArray = [];
        switch(id){
            case 1:
                attributeArray = [
                    "Test Card",
                    "P",
                    "A test card, created to test cards.",
                    //Owner is owner.
                    "4", 
                    "opposition", 
                    "none", 
                    "none"];
                break;
        }
        this.name =         attributeArray[0];
        this.type =         attributeArray[1];
        this.description =  attributeArray[2];

        this.magnitude =    attributeArray[3];
        this.target =       attributeArray[4];
        this.effect =       attributeArray[5];
        this.passive =      attributeArray[6];
    }

    //this needs to deal damage to target and apply effects.
    //How to handle passive effects?
    //How to proccess effects? >>Process at the end of the turn. Separate effect object?
    cardPlayed(){

    }
}