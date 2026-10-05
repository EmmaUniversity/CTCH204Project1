let pageBuffer;
let pageWidth = 210*1.5;
let pageHeight = 297*1.5;
let pageBoundingBoxes;

let pageStyleLineSpacing = 18;
let pageStyleTextSize = 15;
let pageStyleMargins = 10;

function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(pageWidth, pageHeight);
    updatePage("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ")
}


function updatePage(contents) {
    pageBoundingBoxes = [];
    
    //top left origin for each word's drawing location
    let cursorX = pageStyleMargins;
    let cursorY = pageStyleMargins;
    let words = contents.split(" ");

    //draw setup
    pageBuffer.background(245);
    pageBuffer.textSize(pageStyleTextSize);
    pageBuffer.textAlign(LEFT, TOP);

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

            pageBoundingBoxes.push(wordBounds);

        }
    }

    //bounding box test drawing
    for (let i = 0; i < pageBoundingBoxes.length; i++) {
        let bb = pageBoundingBoxes[i];
        pageBuffer.noStroke()
        pageBuffer.fill(random(255), random(255), random(255), 80)
        pageBuffer.rect(bb.x, bb.y, bb.w, bb.h);
    }
    
}

function draw() {

    background(220);

    //pageBuffer.background(245)
    //textWrap(WORD);
    //pageBuffer.text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ", 
    //    10, 10, pageWidth-20, pageHeight-20
    //)
    image(pageBuffer, 10, 10)

}
