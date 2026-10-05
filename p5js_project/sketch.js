//assets
let imgMarker;
let imgMarkerLid;

//page variables
let pageBuffer;
let pageOverlayBuffer;

let pageWidth = 210*1.5;
let pageHeight = 297*1.5;
let pageX = 10;
let pageY = 10;

//page styling
let pageStyleLineSpacing = 18;
let pageStyleTextSize = 15;
let pageStyleMargins = 10;

//page interaction
let pagePositionState = "entering"
//one of:
// entering
// exiting
// interactable
// offScreen

let pageBoundingBoxes;
let pageLines;
let markedWords = [[8, 12], [13, 15], [30, 30]]; //example
let markedWordsProgress = [0, 0, 0]; //example
let markedWordsGoal = [0, 0, 0]; //example

//page animation
let pageDestinationX = 0;
let pageDestinationY = 0;
let pageAnimationOffsetX = 0;
let pageAnimationOffsetY = -650;
let pageAnimationOffsetRotation = 0; //not currently implemented because I can't find a good way to rotate images without webGL :/
let pageDestinations = new Map();

//gui
let markerX = 360;
let markerY = 300;
let markerSeperation = 0;

//game variables
let activeTool = "hand";
//one of:
// marker
// hand

let isMarking = false;
let markingLine = -1; //index into pageLines array
let markingIndex = -1; //index into markedWords array

let isSending = false;
let sendStartX = -1;
let sendStartY = -1;
let sendDestination = -1;
let sendDistance = 0;

async function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(pageWidth, pageHeight);
    pageOverlayBuffer = createGraphics(pageWidth, pageHeight);
    updatePage("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ")

    //load images
    imgMarker = await loadImage("p5js_project/assets/marker.png");
    imgMarkerLid = await loadImage("p5js_project/assets/marker_lid.png");

    pageDestinations.set(0, createVector(0, 650)); //down
    pageDestinations.set(1, createVector(650, 0)); //right
    pageDestinations.set(2, createVector(0, -650)); //up
}



function updatePage(contents) {
    pageBoundingBoxes = [];
    pageLines = [];
    markedWords = [];
    markedWordsProgress = [];
    markedWordsGoal = [];
    
    //top left origin for each word's drawing location
    let cursorX = pageStyleMargins;
    let cursorY = pageStyleMargins;
    
    //body text
    let words = contents.split(" ");

    //draw setup
    pageBuffer.background(245);
    pageBuffer.textSize(pageStyleTextSize);
    pageBuffer.textAlign(LEFT, TOP);

    //lines array to help with mouse inputs
    let currentBoundingBoxLine = new Map();
    currentBoundingBoxLine.set("y", cursorY);
    currentBoundingBoxLine.set("boundingBoxes", []);
    pageLines.push(currentBoundingBoxLine);

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

    //debug bounding box visualization
    //for (let i = 0; i < pageBoundingBoxes.length; i++) {
    //    let bb = pageBoundingBoxes[i];
    //    pageBuffer.noStroke()
    //    pageBuffer.fill(random(255), random(255), random(255), 80)
    //    pageBuffer.rect(bb.x, bb.y, bb.w, bb.h);
    //}
    
}



//TODO: refactor to make not a function
function sendDocument(destination) {
    pageDestinationX = pageDestinations.get(destination).x;
    pageDestinationY = pageDestinations.get(destination).y;
    pagePositionState = "exiting";
}

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

//game logic
function mousePressed(event) {
    if (pagePositionState == "interactable" && (mouseX >= pageX && mouseX < pageX+pageWidth) && (mouseY >= pageY && mouseY < pageY+pageHeight)) {
        
        //page interactions
        switch(activeTool) {
            case "marker":
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
                console.log(selectedWordBoundingBoxIndex);
                markedWords.push([selectedWordBoundingBoxIndex, selectedWordBoundingBoxIndex])
                markedWordsProgress.push(0);
                markedWordsGoal.push(0);
                isMarking = true;
                markingLine = selectedLine; //index into pageLines array
                markingIndex = markedWords.length-1; //index into markedWords array

                break;
            
            case "hand":
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

    if (isSending) {
        let xx = mouseX-sendStartX;
        let yy = mouseY-sendStartY;
        sendDistance = sqrt((xx*xx)+(yy*yy))

        if (!mouseIsPressed) {
            if (sendDistance > 64 && sendDestination != -1) {
                sendDocument(sendDestination);
            }

            sendDestination = -1;
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

}



function draw() {
    //execute game logic before drawing the frame
    tick()

    background(220);
    
    //let pagePositionState = "entering"
    //one of:
    // entering
    // exiting
    // interactable
    // offScreen

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

            if ((abs(pageAnimationOffsetX) < 2) && (abs(pageAnimationOffsetY) < 2)) {
                pageAnimationOffsetX = 0;
                pageAnimationOffsetY = 0;
                pagePositionState = "interactable"
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

    //draw page overlay
    //debug word selection visulationzation
    //let selectedLine = getHoveredLine();
    //if (selectedLine != -1) {
    //    let selectedWord = getHoveredWord(selectedLine);
    //    if (selectedWord != -1) {
    //        let lineBoundingBoxes = pageLines[selectedLine].get("boundingBoxes");
    //        let bb = pageBoundingBoxes[lineBoundingBoxes[selectedWord]];
    //        pageOverlayBuffer.noStroke();
    //        pageOverlayBuffer.fill(0, 255, 0, 90);
    //        pageOverlayBuffer.rect(bb.x, bb.y, bb.w, bb.h);
    //    }
    //}

    //draw marks
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

    //draw gui
    markerSeperation = lerp(markerSeperation, (activeTool == "marker")*50, 0.1);
    image(imgMarker, markerX, markerY+markerSeperation);
    image(imgMarkerLid, markerX, markerY-markerSeperation);

}
