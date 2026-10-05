//draw variables
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
let markedWordsGoal = [0, 0, 0]

//game variables
let isMarkerActive = true;

function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(pageWidth, pageHeight);
    pageOverlayBuffer = createGraphics(pageWidth, pageHeight);
    updatePage("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ")
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

    //bounding box test drawing
    //for (let i = 0; i < pageBoundingBoxes.length; i++) {
    //    let bb = pageBoundingBoxes[i];
    //    pageBuffer.noStroke()
    //    pageBuffer.fill(random(255), random(255), random(255), 80)
    //    pageBuffer.rect(bb.x, bb.y, bb.w, bb.h);
    //}
    
}



function draw() {
    background(220);
    
    pageOverlayBuffer.clear();
    image(pageBuffer, pageX, pageY);


    //draw markers

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
        
        if (hoveredLine != -1) {
            let selectedWordBoundingBox = -1;
            let lineBoundingBoxes = pageLines[hoveredLine].get("boundingBoxes")

            for (let i = 0; i < lineBoundingBoxes.length; i++) {
                let bb = pageBoundingBoxes[lineBoundingBoxes[i]];
                if (mouseX-pageX > bb.x && mouseX-pageX < bb.x+bb.w) {
                    selectedWordBoundingBox = i;
                    break;
                }
            }

            if (selectedWordBoundingBox != -1) {
                let bb = pageBoundingBoxes[lineBoundingBoxes[selectedWordBoundingBox]];

                pageOverlayBuffer.noStroke();
                pageOverlayBuffer.fill(0, 255, 0, 90);
                pageOverlayBuffer.rect(bb.x, bb.y, bb.w, bb.h);
            }
        }
    }

    for (let i = 0; i < markedWords.length; i++) {
        let span = markedWords[i];

        let bbStart = pageBoundingBoxes[span[0]]
        let bbEnd = pageBoundingBoxes[span[1]]
        let spanStart = bbStart.x;
        let spanWidth = (bbEnd.x + bbEnd.w)-bbStart.x;

        //marker animation
        markedWordsGoal[i] = spanWidth
        markedWordsProgress[i] = lerp(markedWordsProgress[i], markedWordsGoal[i], 0.1)
        //marker animation sound
        if (markedWordsGoal[i]-markedWordsProgress[i] > 3) {
            //TODO: marker sound (if I have time)
        }

        //draw the mark
        pageOverlayBuffer.noStroke();
        pageOverlayBuffer.fill(255, 0, 0, 90);
        pageOverlayBuffer.rect(spanStart, bbStart.y, markedWordsProgress[i], bbStart.h);
    }

    image(pageOverlayBuffer, pageX, pageY);

}
