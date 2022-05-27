//This file is just a list of a bunch of enemies that returns an object.
function createNewEnemy(enemyTier) {
    //enemies go from id = 0 to id = max-1
    //Duplicate one for id = max-1, in case it actually rands that one.
    let id, tier;
    let tempEnemy;

    tier = playerRandInt(1, enemyTier, "floor"); //choose a tier.

    switch (tier) { //return certain tiers of enemies.
        case 1: //Tier 1 enemies
            do {
                id = playerRandInt(0, 5, "floor");
                switch (id) {
                    case 0:
                        tempEnemy = new Enemy(20, 10, 3, 1, "Avarice", "A wispy shape arises from the city's crevices, all hunger and no fulfillment.", "Avarice diffuses back into the shadows.");
                        break;
                    case 1:
                        //Arrogance is naught but sharp tongue and pointing finger.
                        tempEnemy = new Enemy(30, 5, 3, 1, "Arrogance", "A creature blocks the road, all sharp tongue and pointing finger.", "Vanquishes arrogance with a cry.");
                        break;
                    case 2:
                        //Despair gives courage to the coward.
                        tempEnemy = new Enemy(5, 5, 4, 1, "Cowardice", "Despair gives courage to a shaking form.", "Cut down as it flees.");
                        break;
                    case 3:
                        //To tell a white lie.
                        tempEnemy = new Enemy(10, 15, 4, 1, "Insincerity", "Bone-white flashes in monochrome light.", "A lie in masquerade. The mask shatters.");
                        break;
                    case 4:
                        tempEnemy = new Enemy(20, 10, 3, 1, "Grief", "A keening wail pierces the silence.", "Grief abates. The ache, too, in time.");
                        break;
                    case 5:
                        //Do not cut off your nose to spite your face.
                        tempEnemy = new Enemy(30, 10, 3, 1, "Spite", "This face has no nose.", "A lilting melody quells the spite.");
                        break;
                }
            } while (tempEnemy.name == enemy.name); //don't choose same enemy twice.
            break;
        case 2:
            do {
                id = playerRandInt(0, 5, "floor");
                switch (id) {
                    case 0:
                        tempEnemy = new Enemy(20, 10, 3, 1, "Promiscuity", "", "");
                        break;
                    case 1:
                        tempEnemy = new Enemy(30, 5, 3, 1, "Gluttony", "", "");
                        break;
                    case 2:
                        tempEnemy = new Enemy(5, 5, 4, 1, "Wrath", "", "");
                        break;
                    case 3:
                        tempEnemy = new Enemy(10, 15, 4, 1, "Cruelty", "", "");
                        break;
                    case 4:
                        tempEnemy = new Enemy(20, 10, 3, 1, "Rage", "", "");
                        break;
                    case 5:
                        tempEnemy = new Enemy(30, 10, 3, 1, "Hypocrisy", "", "");
                        break;
                }
            } while (tempEnemy.name == enemy.name); //don't choose same enemy twice.
            break;
    }



    return tempEnemy;
}

//This file is just a list of items by ID.
/* ID SCHEME
C - consumables.
T - tokens/talismans <-- for the plot.
*/
function createNewItem(id){ 
    switch(id){
        case "1-T":
            return new item("Dragon Talisman", "A blessing from the Clairvoyant.", "encounter", "1-T");
    }
}

//These are possible victory scripts.
function createVictoryDialogue(){
    
}