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
let pageBoundingBoxes;
let pageLines;

let pageStyleLineSpacing = 18;
let pageStyleTextSize = 15;
let pageStyleMargins = 10;

let markedWords = [[8, 12], [13, 15], [30, 30]];
let markedWordsProgress = [0, 0, 0];
let markedWordsGoal = [0, 0, 0];

//gui
let markerX = 360;
let markerY = 300;
let markerSeperation = 0;

//game variables
let activeTool = "marker";
//one of these:
// marker
// hand

let isMarking = false;
let markingLine = -1; //index into pageLines array
let markingIndex = -1; //index into markedWords array

async function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(pageWidth, pageHeight);
    pageOverlayBuffer = createGraphics(pageWidth, pageHeight);
    updatePage("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ")

    //load images
    imgMarker = await loadImage("p5js_project/assets/marker.png");
    imgMarkerLid = await loadImage("p5js_project/assets/marker_lid.png");
}



function updatePage(contents) {
    pageBoundingBoxes = [];
    pageLines = [];
    
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
    if ((mouseX >= pageX && mouseX < pageX+pageWidth) && (mouseY >= pageY && mouseY < pageY+pageHeight)) {
        
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

}



function draw() {
    //execute game logic before drawing the frame
    tick()

    background(220);
    
    //draw the page
    pageOverlayBuffer.clear();
    image(pageBuffer, pageX, pageY);

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

    image(pageOverlayBuffer, pageX, pageY);

    //draw gui
    markerSeperation = lerp(markerSeperation, (activeTool == "marker")*50, 0.1);
    image(imgMarker, markerX, markerY+markerSeperation);
    image(imgMarkerLid, markerX, markerY-markerSeperation);

}
