//assets
let imgMarker;
let imgMarkerLid;
let imgCalendarPageBack;
let imgCalendarPageFront;
let imgCalendarRings;
let imgCalendarCrosses = [];


//page variables
let pageBuffer;
let pageOverlayBuffer;

let pageWidth = 210*1.5;
let pageHeight = 297*1.5;
let pageX = 10;
let pageY = 10;

//page styling
let pageStyleLineSpacing = 15;
let pageStyleHeaderSpace = 33
let pageStyleTextSize = 12;
let pageStyleHeaderSize = 20;
let pageStyleFotterSize = 12;
let pageStyleMargins = 10;

//page interaction
let pagePositionState = "entering"
//one of:
// entering
// exiting
// interactable
// offScreen

let isPageSendable = false; //if false, the game has reached a end state
let isPageMarkable = false;
let isPageInfraction = false;

let pageBoundingBoxes;
let pageLines;
let markedWords = [[8, 12], [13, 15], [30, 30]]; //contains size two arrays where both values are indicies into the words array, and they define a span starting at the first value and ending at the second

//marker animation
let markedWordsProgress = [];
let markedWordsGoal = [];

//page animation
let pageDestinationX = 0;
let pageDestinationY = 0;
let pageAnimationOffsetX = 0;
let pageAnimationOffsetY = -650;
let pageAnimationOffsetRotation = 0; //not currently implemented because I can't find a good way to rotate images without webGL :/
let pageDestinations = new Map();

//gui
let markerX = 0;
let markerY = 480;
let markerSeperation = 0;

let calendarX = 335;
let calendarY = 10;
let calendarPageWidth = 155;
let calendarPageHeight = 143;
let calendarPages = []; //array of maps, see addCalendarPage() for keys/values
let calendarMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
let calendarCenterOffset = 143; //the y coordinate of the center line between the top and bottom page

let tallyX = 500;
let tallyY = 10;
let tallyWidth = 90;
let tallyHeight = 285;

let agendaX = 335;
let agendaY = 305;
let agendaWidth = 255;
let agendaHeight = 285;
let agendaText = "";


//game variables
let activeTool = "hand";
//one of:
// marker
// hand

//marking
let isMarking = false;
let markingLine = -1; //index into pageLines array
let markingIndex = -1; //index into markedWords array

//sending document away
let isSending = false;
let sendStartX = -1;
let sendStartY = -1;
let sendDestination = -1;
let sendDistance = 0;


//scenario
let scenario;
let documents;
let infractionKeys = ["infraction1", "infraction2", "infraction3"]; //index infractions number into the specialDocuments table in the scenario

let currentDocument = 0;

let strikes = 0;
let time = 0;
let spending = 0;

let ruleExitDirection = 0; //index into pageDestinations
let ruleToMark; //same format of markedWords, contains the correct set of spans for what should be marked



// -<>- SETUP -<>-

async function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(pageWidth, pageHeight);
    pageOverlayBuffer = createGraphics(pageWidth, pageHeight);

    //load images
    imgMarker = await loadImage("p5js_project/assets/marker.png");
    imgMarkerLid = await loadImage("p5js_project/assets/marker_lid.png");
    imgCalendarPageFront = await loadImage("p5js_project/assets/calendar_page_front.png");
    imgCalendarPageBack = await loadImage("p5js_project/assets/calendar_page_back.png");
    imgCalendarRings = await loadImage("p5js_project/assets/calendar_rings.png")
    imgCalendarCrosses.push(
        await loadImage("p5js_project/assets/calendar_cross_0.png"),
        await loadImage("p5js_project/assets/calendar_cross_1.png"),
        await loadImage("p5js_project/assets/calendar_cross_2.png"),
        await loadImage("p5js_project/assets/calendar_cross_3.png"),
        await loadImage("p5js_project/assets/calendar_cross_4.png"),
        await loadImage("p5js_project/assets/calendar_cross_5.png"),
        await loadImage("p5js_project/assets/calendar_cross_6.png"),
        await loadImage("p5js_project/assets/calendar_cross_7.png"),
        await loadImage("p5js_project/assets/calendar_cross_8.png")
    )

    //set up page desstinations
    pageDestinations.set(0, createVector(0, 650)); //down
    pageDestinations.set(1, createVector(650, 0)); //right
    pageDestinations.set(2, createVector(0, -650)); //up

    //scenario
    scenario = await loadJSON("p5js_project/scenario.json");
    documents = scenario.documents;
    loadDocument(0);

    //calendar setup
    addCalendarPage(-1, PI);
    addCalendarPage(0);
}



// -<>- SCENARIO -<>-
//load a document from the scenario
function loadDocument(index) {
    //entering animation
    let positionEnter = pageDestinations.get(documents[index].rules.directionEnter);
    pageAnimationOffsetX = positionEnter.x;
    pageAnimationOffsetY = positionEnter.y;
    
    //state
    pagePositionState = "entering";
    isPageInfraction = false;

    //rules
    ruleExitDirection = documents[index].rules.directionExit;
    ruleToMark = documents[index].rules.toMark;
    isPageSendable = documents[index].rules.canSend;
    isPageMarkable = documents[index].rules.canMark;

    //update page variables and draw page
    updatePage(documents[index].document.body, documents[index].document.header, documents[index].document.footer);
}

//TODO: fix code duplication between this and load document
//load an infraction document from the scenario
function loadInfraction(index) {
    let infaction = scenario.specialDocuments[infractionKeys[index]]

    //entering animation
    let positionEnter = pageDestinations.get(infaction.rules.directionEnter);
    pageAnimationOffsetX = positionEnter.x;
    pageAnimationOffsetY = positionEnter.y;
    
    //state
    pagePositionState = "entering";
    isPageInfraction = true;

    //rules
    ruleExitDirection = infaction.rules.directionExit;
    ruleToMark = infaction.rules.toMark;
    isPageSendable = infaction.rules.canSend;
    isPageMarkable = infaction.rules.canMark;

    //update page variables and draw page
    updatePage(infaction.document.body, infaction.document.header, infaction.document.footer);
}
 
//run when a document has been sent to check wehter the player followed the rules,
//and to load the next document or infraction
function completeDocument() {

    //entire punishment logic is commented out because the logic to check whether or not the player highlighted
    //the correction sections has a game breaking bug that I could not find ot fix within the limited time I have left to finish
    //hopefully I've remembered to write my reasons for why I don't think this is as bad as it seems in my reflection

    //TODO: fix and reimplement
    //check if the player marked the right words
    //let markerCompliant = true;
    //if (!isPageInfraction) {
    //    //check for marked word compliance
    //    //this algo is probably very inefficent. I'm to sleepy to program something better
    //    let totalScenarioMarked = 0
    //    let totalScenarioUnmarked = 0
    //    let errorUnmarked = 0
    //    let errorMarked = 0
    //    let currentPlayerMarkIndex = 0
    //    let currentScenarioMarkIndex = 0
    //    let scenarioMarked = documents[currentDocument].rules.toMark
    //    for (let i = 0; i < pageBoundingBoxes.length; i++) {
    //        let markedByPlayer = false;
    //        if (!(currentPlayerMarkIndex >= markedWords.length)) {
    //            if (i >= markedWords[currentPlayerMarkIndex][0] && i < markedWords[currentPlayerMarkIndex][1]) {
    //                markedByPlayer = true;
    //            } else if (i == markedWords[currentPlayerMarkIndex][1]) {
    //                markedByPlayer = true;
    //                currentPlayerMarkIndex++;
    //            }
    //        }
    //
    //        let markedByScenario = false;
    //        if (!(currentScenarioMarkIndex >= scenarioMarked.length)) {
    //            if (i >= scenarioMarked[currentScenarioMarkIndex][0] && i < scenarioMarked[currentScenarioMarkIndex][1]) {
    //                markedByScenario = true;
    //            } else if (i == scenarioMarked[currentScenarioMarkIndex][1]) {
    //                markedByScenario = true;
    //                currentScenarioMarkIndex++;
    //            }
    //        }
    //
    //        if (markedByScenario) {
    //            totalScenarioMarked++;
    //            if (!markedByPlayer) {
    //                errorUnmarked++;
    //            }
    //        } else {
    //            totalScenarioUnmarked++;
    //            if (markedByPlayer) {
    //                errorMarked++;
    //            }
    //        }
    //    }
    //
    //    print("Marked: " + str(totalScenarioMarked) + ", " + str(totalScenarioMarked-errorUnmarked) + ", " + str((totalScenarioMarked-errorUnmarked)/totalScenarioMarked));
    //    print("Unmarked: " + str(totalScenarioUnmarked) + ", " + str(totalScenarioUnmarked-errorMarked) + ", " + str((totalScenarioUnmarked-errorMarked)/totalScenarioUnmarked));
    //    print(scenarioMarked)
    //    print(markedWords)
    //
    //    let unmarkedCorrectnessRatio = (totalScenarioUnmarked-errorMarked)/totalScenarioUnmarked;
    //    //protect from a divide by zero
    //    let markedCorrectnessRatio;
    //    if (totalScenarioMarked > 0) {
    //        markedCorrectnessRatio = (totalScenarioMarked-errorUnmarked)/totalScenarioMarked;
    //    } else {
    //        markedCorrectnessRatio = 1;
    //    }
    //
    //    if (unmarkedCorrectnessRatio < 0.75 || markedCorrectnessRatio < 0.75) {
    //        markerCompliant = false;
    //    }
    //
    //    time += documents[currentDocument].effects.timeElapsed;
    //    spending += documents[currentDocument].effects.moneySpent;
    //    if (documents[currentDocument].effects.doAgendaUpdate) {
    //        agendaText = documents[currentDocument].effects.agenda;
    //    }
    //
    //    //only increment the document index if current page is not an infraction so as not to skip documents
    //    currentDocument++;
    //}
    //
    ////check if the player sent the document in the right direction
    ////and check if the marks words compliance check passed
    //if ((!sendDestination == ruleExitDirection) || (!markerCompliant)) {
    //    loadInfraction(strikes);
    //    strikes++;
    //    return; //do not load next document
    //}

    //load next document
    currentDocument++                                            //Remove when reimplementing the punishment logic
    time += documents[currentDocument].effects.timeElapsed;      //Remove when reimplementing the punishment logic
    spending += documents[currentDocument].effects.moneySpent;   //Remove when reimplementing the punishment logic
    loadDocument(currentDocument);
}

//add a calendarPage
function addCalendarPage(offset, angle=0) {
    //create page, buffer, and draw page image to buffer
    let calendarPage = new Map();
    calendarPage.set("buffer", createGraphics(calendarPageWidth, calendarPageHeight));
    calendarPage.get("buffer").image(imgCalendarPageFront, 0, 0);
    
    //offset from starting time of the game in months
    calendarPage.set("offset", offset);

    //animation
    calendarPage.set("angle", angle);
    calendarPage.set("flipped", false);
    calendarPage.set("flipping", false);
    calendarPage.set("marks", 0);
    
    calendarPages.push(calendarPage);
}

//redraws page buffer, and resets associated marking related marking variables/arrays
function updatePage(contents, header, footer) {
    //reset page variables
    pageBoundingBoxes = [];
    pageLines = [];
    markedWords = [];
    markedWordsProgress = [];
    markedWordsGoal = [];
    pageBuffer.background(245);
    
    //draw header
    pageBuffer.textAlign(LEFT, TOP);
    pageBuffer.textSize(pageStyleHeaderSize);
    pageBuffer.text(header, pageStyleMargins, pageStyleMargins);

    //draw footer
    pageBuffer.textAlign(LEFT, BOTTOM);
    pageBuffer.textSize(pageStyleFotterSize);
    pageBuffer.text(footer, pageStyleMargins, pageHeight-pageStyleMargins);

    //body text
    let words = contents.split(" ");

    //top left origin for each word's drawing location
    let cursorX = pageStyleMargins;
    let cursorY = pageStyleMargins+pageStyleHeaderSpace;

    //draw setup
    pageBuffer.textSize(pageStyleTextSize);
    pageBuffer.textAlign(LEFT, TOP);

    //lines array to help with mouse inputs
    let currentBoundingBoxLine = new Map();
    currentBoundingBoxLine.set("y", cursorY);
    currentBoundingBoxLine.set("boundingBoxes", []);
    pageLines.push(currentBoundingBoxLine);

    //draw body text
    for (let i = 0; i < words.length; i++) {
        //space needs to come before word because the textBounds function does not consider trailing spaces
        let word = " "+words[i];
        let wordBounds = pageBuffer.textBounds(word, cursorX, cursorY);
        let wordEnd = wordBounds.x+wordBounds.w;

        if (wordEnd < pageWidth-pageStyleMargins) {
            //word does not go past margin, drawn normally
            pageBuffer.text(word, cursorX, cursorY);
            cursorX = wordEnd;
            
            pageBoundingBoxes.push(wordBounds);
            currentBoundingBoxLine.get("boundingBoxes").push(pageBoundingBoxes.length-1);

        } else {
            //word goes past margin, move cursor to next line and reset to start of line
            //remove leading space from first word of each line to create more consistant margin
            word = word.slice(1)

            cursorY += pageStyleLineSpacing;
            cursorX = pageStyleMargins;
            
            //update word bounds accounting for new position
            wordBounds = pageBuffer.textBounds(word, cursorX, cursorY);
            wordEnd = wordBounds.x+wordBounds.w;

            pageBuffer.text(word, cursorX, cursorY);
            cursorX = wordEnd;

            //create new line for mouse input
            currentBoundingBoxLine = new Map();
            currentBoundingBoxLine.set("y", cursorY);
            currentBoundingBoxLine.set("boundingBoxes", []);
            pageLines.push(currentBoundingBoxLine);

            pageBoundingBoxes.push(wordBounds);
            currentBoundingBoxLine.get("boundingBoxes").push(pageBoundingBoxes.length-1);

        }
    }
    
}



// -<>- HELPER FUNCTIONS -<>-

//returns index into pageLines array that matches mouse y
function getHoveredLine() {
    if ((mouseX >= pageX && mouseX < pageX+pageWidth) && (mouseY >= pageY && mouseY < pageY+pageHeight)) {
        let hoveredLine = -1;

        for (let i = 0; i < pageLines.length; i++) {
            if (mouseY-pageY < pageLines[i].get("y")+pageStyleLineSpacing) {
                if (mouseY-pageY >= pageLines[i].get("y")) {
                    hoveredLine = i;
                    break;
                }
            }
        }

        return hoveredLine;
    } else {
        return -1;
    }
}

//returns index into line's bounding box index array, not into the bounding box array itself
function getHoveredWord(lineIndex) {
    let selectedWordBoundingBox = -1;
    let lineBoundingBoxes = pageLines[lineIndex].get("boundingBoxes");

    for (let i = 0; i < lineBoundingBoxes.length; i++) {
        let bb = pageBoundingBoxes[lineBoundingBoxes[i]];
        if (mouseX-pageX > bb.x && mouseX-pageX < bb.x+bb.w) {
            selectedWordBoundingBox = i;
            break;
        }
    }
    
    return selectedWordBoundingBox;
}

//convert an int into a compacted string representaiton of the dollar amount
function dollarsToString(number) {
    if (number < 10000) {
        return str(floor(number))
    } else if (number < 100000) {
        return str(floor(number/100)/10)+"K"
    } else if (number < 10000000) {
        return str(floor(number/1000))+"K"
    } else if (number < 100000000) {
        return str(floor(number/100000)/10)+"M"
    } else if (number < 10000000000) {
        return str(floor(number/1000000))+"M"
    } else {
         return str(floor(number/100000000)/10)+"B"
    }
}

//convert an into into a string showing the years and days
function timeToString(number) {
    if (number < 360) {
        return str(number) + " days"
    } else {
        return str(floor(number/360)) + " years\n" + str(number%360) + " days"
    }
}



// -<>- INPUT -<>-

function mousePressed(event) {
    if (pagePositionState == "interactable" && (mouseX >= pageX && mouseX < pageX+pageWidth) && (mouseY >= pageY && mouseY < pageY+pageHeight)) {
        
        //page interactions
        switch(activeTool) {
            case "marker":
                if (!isPageMarkable) {
                    break;
                } 

                //get selected word
                let selectedLine = getHoveredLine();
                let selectedWord = -1;
                if (selectedLine != -1) {
                    selectedWord = getHoveredWord(selectedLine);
                }

                if (selectedLine == -1 || selectedWord == -1)  {
                    console.log("marking failed: couldn't find slected word");
                    break; // can't start a marker selection if not hovering a word
                }

                let lineBoundingBoxes = pageLines[selectedLine].get("boundingBoxes");
                let selectedWordBoundingBoxIndex = lineBoundingBoxes[selectedWord]

                let wordAlreadyMarked = false;
                for (let i = 0; i < markedWords.length; i++) {
                    let mark = markedWords[i];
                    if (selectedWordBoundingBoxIndex >= mark[0] && selectedWordBoundingBoxIndex <= mark[1]) {
                        wordAlreadyMarked = true;
                        break;
                    }
                }

                if (wordAlreadyMarked == true) {
                    console.log("marking failed: word already marked");
                    break; // can't start a marker selection from an already marked word
                }

                //selected starting word is good
                markedWords.push([selectedWordBoundingBoxIndex, selectedWordBoundingBoxIndex])
                markedWordsProgress.push(0);
                markedWordsGoal.push(0);
                isMarking = true;
                markingLine = selectedLine; //index into pageLines array
                markingIndex = markedWords.length-1; //index into markedWords array

                break;
            
            case "hand":
                if (!isPageSendable) {
                    break;
                }    

                isSending = true;
                sendStartX = mouseX;
                sendStartY = mouseY;

                break;
        }
    } else {
        //gui interactions

        if ((mouseX >= markerX && mouseX < markerX+imgMarker.width) && (mouseY >= markerY && mouseY < markerY+imgMarker.height)) {
            if (activeTool == "marker") {
                activeTool = "hand";
            } else {
                activeTool = "marker";
            }
        }
    }
}



// -<>- FRAME LOOP -<>-

//runs before draw code to handle frame by frame game logic
//that isn't related to the visuals
function tick() {
    if (isMarking) {
        if (!mouseIsPressed) {
            isMarking = false;
            markingLine = -1;
            markingIndex = -1;
        } else {
            let selectedWord = getHoveredWord(markingLine);
            if (selectedWord != -1) {
                //exapnd marker selection
                let lineBoundingBoxes = pageLines[markingLine].get("boundingBoxes");
                let selectedWordBoundingBoxIndex = lineBoundingBoxes[selectedWord]
                if (selectedWordBoundingBoxIndex < markedWords[markingIndex][0]) {
                    //fix animation jank when marking opposite english reading order
                    let bbOld = pageBoundingBoxes[markedWords[markingIndex][0]]
                    let bbNew = pageBoundingBoxes[selectedWordBoundingBoxIndex]
                    let xDif = bbOld.x-bbNew.x
                    markedWordsProgress[markingIndex] += xDif
                    
                    markedWords[markingIndex][0] = selectedWordBoundingBoxIndex
                    
                } else if (selectedWordBoundingBoxIndex > markedWords[markingIndex][1]) {
                    markedWords[markingIndex][1] = selectedWordBoundingBoxIndex
                }
            }
        }
    }


    //paper dragging animation
    if (isSending) {
        let xx = mouseX-sendStartX;
        let yy = mouseY-sendStartY;
        sendDistance = sqrt((xx*xx)+(yy*yy))

        //released paper
        if (!mouseIsPressed) {
            if (sendDistance > 64 && sendDestination != -1) {
                pageDestinationX = pageDestinations.get(sendDestination).x;
                pageDestinationY = pageDestinations.get(sendDestination).y;
                pagePositionState = "exiting";
            }

            sendDistance = 0;
            sendStartX = -1;
            sendStartY = -1;
            isSending = false;

        } else {
            //set send destination based on what 90 degree quadrent mouse is in
            if (abs(xx) > abs(yy)) {
                if (xx < 0) {
                    sendDestination = -1;
                } else {
                    sendDestination = 1;
                }
            } else {
                if (yy < 0) {
                    sendDestination = 2;
                } else {
                    sendDestination = 0;
                }
            }
        }
    }


    //update calendar pages
    for (let i = 0; i < calendarPages.length; i++) {
        let calendarPage = calendarPages[i];
        let buffer = calendarPage.get("buffer");

        //update angle
        if (calendarPage.get("flipping")) {
            calendarPage.set("angle", min(calendarPage.get("angle")+0.1, PI));
            if (calendarPage.get("angle") >= PI) {
                calendarPage.set("flipping", false);
            }
        }

        //update buffer
        if (!calendarPage.get("flipped")) {
            let offset = calendarPage.get("offset");
            let marksCurrent = calendarPage.get("marks");
            
            let relativeTime = time-(30*offset);

            if ((relativeTime > 30) && (calendarPage.get("flipping") == false) && (calendarPage.get("angle") < PI/2) && (marksCurrent >= 30)) {
                calendarPage.set("flipping", true);
                addCalendarPage(offset+1);
            }

            relativeTime = min(relativeTime, 30);
            if (relativeTime > marksCurrent) {
                buffer.image(random(imgCalendarCrosses), 20+((marksCurrent%6)*19), 30+(floor(marksCurrent/6)*19));
                marksCurrent += 1;
                calendarPage.set("marks", marksCurrent);
            }

            if (calendarPage.get("angle") > PI/2) {
                calendarPage.set("flipped", true);
                buffer.clear();
                buffer.image(imgCalendarPageBack, 0, 0);
                buffer.textAlign(CENTER, CENTER);
                buffer.textSize(50);
                buffer.noStroke();
                buffer.fill(255, 0, 0);
                buffer.text(calendarMonths[(offset+1)%calendarMonths.length], 77, 67);
            }
        }
    }

    //remove redundant pages
    let calendarPageSecond = calendarPages[1];
    if (calendarPageSecond.get("angle") == PI) {
        calendarPages.shift();
    }

}



// -<>- DRAW -<>-

function draw() {
    //execute game logic before drawing the frame
    tick();

    background(220);

    //draw calendar
    //top pages
    for (let i = 0; i < calendarPages.length; i++) {
        let calendarPage = calendarPages[i];
        let buffer = calendarPage.get("buffer");
        let angle = calendarPage.get("angle");
        if (angle > (PI/2)) {
            //evil math
            // for whatever reason, sin(PI) = 1.2e, so you need to add a tiny amount so it doesn't screw up
            let yOffset = calendarCenterOffset-(sin(max(0, (angle+0.000001)-(PI/2)))*calendarCenterOffset);
            let height = calendarPageHeight*abs(cos(angle+0.000001));

            tint(255+((abs(cos(angle))-1)*128))
            image(buffer, calendarX, calendarY+yOffset, imgCalendarPageFront.width, height)
        }
    }

    //bottom pages, have to itterate through backwards for draw order reasons
    for (let i = calendarPages.length-1; i >= 0; i--) {
        let calendarPage = calendarPages[i];
        let buffer = calendarPage.get("buffer");
        let angle = calendarPage.get("angle");
        if (angle < (PI/2)) {
            //evil math
            // for whatever reason, sin(PI) = 1.2, so you need to add a tiny amount so it doesn't screw up
            let yOffset = calendarCenterOffset-(sin(max(0, (angle+0.000001)-(PI/2)))*calendarCenterOffset);
            let height = calendarPageHeight*abs(cos(angle+0.000001));

            tint(255+((abs(cos(angle))-1)*128))
            image(buffer, calendarX, calendarY+yOffset, imgCalendarPageFront.width, height)
        }
        //in a weird spot, but it's the only way to make it overlap with
        //all flap pages, but not with flipping pages
        if (i == calendarPages.length-1) {
            image(imgCalendarRings, calendarX, calendarY);
        }
    }
    tint(255);


    //draw tally
    noStroke();
    fill(245);
    rect(tallyX, tallyY, tallyWidth, tallyHeight);
    textAlign(CENTER, TOP);
    fill(0);
    textSize(pageStyleTextSize);
    text("time\nspent", tallyX+(tallyWidth/2), 30);
    text(timeToString(time), tallyX+(tallyWidth/2), 70);
    text("money\nspent", tallyX+(tallyWidth/2), 120);
    text(dollarsToString(spending), tallyX+(tallyWidth/2), 160);
    text("transit\nbuilt", tallyX+(tallyWidth/2), 210);
    text("0 km", tallyX+(tallyWidth/2), 250);


    //draw agenda
    fill(245);
    rect(agendaX, agendaY, agendaWidth, agendaHeight);
    fill(0);
    textAlign(LEFT, TOP);
    textSize(pageStyleHeaderSize);
    text("Legislative Agenda:", agendaX+pageStyleMargins, agendaY+pageStyleMargins)
    textSize(pageStyleTextSize);
    text(agendaText, agendaX+pageStyleMargins, agendaY+pageStyleMargins+pageStyleHeaderSpace, agendaWidth-(2*pageStyleMargins))


    //page position animation
    switch (pagePositionState) {
        case "entering":
            pageAnimationOffsetX = lerp(pageAnimationOffsetX, 0, 0.1);
            pageAnimationOffsetY = lerp(pageAnimationOffsetY, 0, 0.1);

            if ((abs(pageAnimationOffsetX) < 2) && (abs(pageAnimationOffsetY) < 2)) {
                pageAnimationOffsetX = 0;
                pageAnimationOffsetY = 0;
                pagePositionState = "interactable"
            }

            break;
        
        case "exiting":
            pageAnimationOffsetX = lerp(pageAnimationOffsetX, pageDestinationX, 0.1);
            pageAnimationOffsetY = lerp(pageAnimationOffsetY, pageDestinationY, 0.1);

            if ((abs(pageAnimationOffsetX-pageDestinationX) < 8) && (abs(pageAnimationOffsetY-pageDestinationY) < 8)) {
                pagePositionState = "offscreen";
                completeDocument();
            }

            break;
        
        case "offscreen":

            break;
        
        case "interactable":
            let offset;
            switch (sendDestination) {
                case -1:
                    pageAnimationOffsetX = lerp(pageAnimationOffsetX, 0, 0.1);
                    pageAnimationOffsetY = lerp(pageAnimationOffsetY, 0, 0.1);
                    pageAnimationOffsetRotation = lerp(pageAnimationOffsetRotation, 0, 0.1);
                    break;
                
                case 0:
                    //sending down
                    offset = max(0, sendDistance-60); // deadzone
                    offset = sin(min(offset/100, PI/2)); //curve
                    offset = offset*50; //magnitude

                    pageAnimationOffsetY = lerp(pageAnimationOffsetY, offset, 0.1);
                    pageAnimationOffsetX = lerp(pageAnimationOffsetX, 0, 0.1);
                    break;
                
                case 1:
                    //sending right
                    offset = max(0, sendDistance-60); // deadzone
                    offset = sin(min(offset/100, PI/2)); //curve
                    offset = offset*100; //magnitude

                    pageAnimationOffsetY = lerp(pageAnimationOffsetY, 0, 0.1);
                    pageAnimationOffsetX = lerp(pageAnimationOffsetX, offset, 0.1);
                    break;
                
                case 2:
                    //sending up
                    offset = max(0, sendDistance-60); // deadzone
                    offset = sin(min(offset/100, PI/2)); //curve
                    offset = offset*50; //magnitude

                    pageAnimationOffsetY = lerp(pageAnimationOffsetY, -offset, 0.1);
                    pageAnimationOffsetX = lerp(pageAnimationOffsetX, 0, 0.1);
                    break;
            }
            
            break;

    }


    //draw the page
    pageOverlayBuffer.clear();
    image(pageBuffer, pageX+pageAnimationOffsetX, pageY+pageAnimationOffsetY);


    //draw document overlay (marks)
    for (let i = 0; i < markedWords.length; i++) {
        let span = markedWords[i];

        let bbStart = pageBoundingBoxes[span[0]]
        let bbEnd = pageBoundingBoxes[span[1]]
        let spanStart = bbStart.x;
        let spanWidth = (bbEnd.x + bbEnd.w)-bbStart.x;

        //marker animation
        markedWordsGoal[i] = spanWidth
        markedWordsProgress[i] = lerp(markedWordsProgress[i], markedWordsGoal[i], 0.1)

        //draw the mark
        pageOverlayBuffer.noStroke();
        pageOverlayBuffer.fill(255, 0, 0, 90);
        pageOverlayBuffer.rect(spanStart, bbStart.y, markedWordsProgress[i], bbStart.h);
    }
    image(pageOverlayBuffer, pageX+pageAnimationOffsetX, pageY+pageAnimationOffsetY);


    //draw marker
    markerSeperation = lerp(markerSeperation, (activeTool == "marker")*50, 0.1);
    image(imgMarker, markerX-markerSeperation, markerY);
    image(imgMarkerLid, (markerX+219)+markerSeperation, markerY);
}
