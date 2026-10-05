let pageBuffer;
let pageWidth = 210;
let pageHeight = 297;

function setup() {
    createCanvas(600, 600);

    pageBuffer = createGraphics(210, 297);
}

function draw() {

    background(220);

    pageBuffer.background(245)
    textWrap(WORD);
    pageBuffer.text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc lobortis dolor et lectus lacinia, a vestibulum odio viverra. Donec id ultrices dui. Sed justo quam, ultricies at ex a, ornare sodales nibh. Aliquam faucibus, eros a tincidunt placerat, augue nisl semper ante, et finibus nisi odio at mi. Curabitur id fermentum nulla, non malesuada tellus. Aenean pellentesque massa eu sem facilisis condimentum. Quisque sit amet massa ultrices lectus consectetur laoreet. Cras vel egestas magna. Donec vel dolor eget risus pharetra porttitor eget nec velit. ", 
        10, 10, pageWidth-20, pageHeight-20
    )
    image(pageBuffer, 10, 10)
    
}
