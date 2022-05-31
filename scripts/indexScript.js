//this file has functions for title page, loss page, and victory page.
//titlepage-----------------------------------------
function showControls() {
    document.getElementById("controlsPanel").style.display = "flex";
}
function hideControls() {
    document.getElementById("controlsPanel").style.display = "none";
}

function startGame() {
    window.location.href = "main.html";
}

//result page script------------------------------------------
function resultScript() {
    let result = sessionStorage.getItem("result");
    //show html page depending on result.
    switch (result) {
        case "lose":
            document.getElementById("outputBar").style.display = "flex";
            resultsOutput(["Another soul lost to the abyss.", "It is over."]);
            break;
        case "win":
            document.getElementById("outputBar").style.display = "flex";
            resultsOutput(["The Clairvoyant blinks.", "Smiles.", "Welcome to Amaryllis."]);
            break;
    }
}

//Output to the page.
async function resultsOutput(messages) {
    var extenalOutputDiv = document.getElementById("outputBar");
    //clear boxes.
    var outputBoxes = [];
    for (var i = 0; i < 4; i++) {
        outputBoxes.push(document.getElementById(`output${i+1}`));
        outputBoxes[i].innerHTML = "";
    }
    //fade in.
    extenalOutputDiv.style.opacity = 0;
    extenalOutputDiv.style.display = "flex";
    await fade("in", extenalOutputDiv);

    //output messages
    for (var k = 0; k < messages.length; k++) {
        await tempOutputFunction(outputBoxes, messages[k]);
    }

    //fade out.
    await fade("out", extenalOutputDiv);
    extenalOutputDiv.style.display = "none";
    return;

    //tempfunc!-------------------------------------
    async function tempOutputFunction(outputBoxes, message) {
        for (var j = (outputBoxes.length - 1); j > 0; j--) {
            outputBoxes[j].innerHTML = outputBoxes[j - 1].innerHTML;
        }
        outputBoxes[0].innerHTML = message;
        await fade("in", outputBoxes[0]);
        await sleep(outputPause);
    }
}